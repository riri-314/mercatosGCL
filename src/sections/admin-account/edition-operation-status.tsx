import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Alert, Box } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { db, functions } from "../../firebase_config";
import { requireMutationSuccess } from "../../utils/callable-result";

type Pending = { id: string; phase: string; lastError?: string; leaseUntil: number };
const labels: Record<string, string> = {
  lock: "Sécurisation des photos", activate: "Activation de l'édition",
  unlock: "Réouverture des photos", passwords: "Réinitialisation des comptes et envoi des e-mails",
  complete: "Finalisation",
};

export default function EditionOperationStatus({ refetchData }: { refetchData: () => void }) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState("");
  const hadPending = useRef(false);
  useEffect(() => onSnapshot(query(collection(db, "editionOperations"), where("state", "==", "pending")), snapshot => {
    setPending(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pending)));
    if (hadPending.current && snapshot.empty) refetchData();
    hadPending.current = !snapshot.empty;
    setError("");
  }, () => setError("Impossible de consulter les opérations en attente.")), [refetchData]);
  const retry = async (id: string) => {
    setRetrying(id);
    try {
      const response = await httpsCallable(functions, "retryeditionoperation")({ operationId: id });
      requireMutationSuccess(response.data);
      refetchData();
      setError("");
    } catch {
      setError("L'opération reste en attente. La reprise automatique est activée.");
    } finally { setRetrying(""); }
  };
  return <Box sx={{ mb: pending.length || error ? 3 : 0 }}>
    {error && <Alert severity="warning">{error}</Alert>}
    {pending.map(operation => <Alert key={operation.id} severity={operation.lastError ? "warning" : "info"}
      action={<LoadingButton loading={retrying === operation.id} onClick={() => retry(operation.id)}>Réessayer</LoadingButton>}>
      {labels[operation.phase] ?? "Opération en cours"}.
      {operation.lastError && " L'opération reprendra automatiquement. Vous pouvez aussi réessayer maintenant."}
    </Alert>)}
  </Box>;
}
