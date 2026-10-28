import { lazy } from "react";
import type { DocumentData } from "firebase/firestore";
import DeferredPanel from "../../components/deferred-panel/deferred-panel";

const NewComitardForm = lazy(() => import("./new-comitard-form"));

export default function NewComitard(props: { data: DocumentData; admin: boolean; refetchData: () => void }) {
  return <DeferredPanel title="Créer nouveau comitard"><NewComitardForm {...props} /></DeferredPanel>;
}
