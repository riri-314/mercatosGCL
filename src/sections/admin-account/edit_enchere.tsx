import { Card, CardContent, Grid, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { useState } from "react";
import QuantityInput from "../../components/inputs/numberInput";
import { DocumentData } from "firebase/firestore";
import { editEnchereAmount } from "../../utils/admin-tools";


interface EditEnchereProps {
  data: DocumentData;
  enchereData: any;
  close: () => void;
  refetchData: () => void;
}

export default function EditEnchere({
  data,
  enchereData,
  close,
  refetchData,
}: EditEnchereProps) {
  const oldValue = enchereData.amount;
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<number>(enchereData.amount);
  const [finished, setFinished] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reemboursement, setRemboursement] = useState<boolean>(true);

  const handleEditEnchere = async () => {
    setLoading(true);
    setError(null);
    setFinished(false);
    try {
      const ret = await editEnchereAmount(data, enchereData.id, value);
      if (ret !== 0) {
        setError("Error updating enchere.");
      }
      setFinished(true);
      refetchData();
    } catch (e: any) {
      console.error("Error editing enchere:", e);
      setError("An error occurred while editing the enchere." + e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer enchère
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={12}>
              <Typography>
                Enchère de {enchereData.senderName} pour:{" "}
                {enchereData.receiverName} ({enchereData.receiverCercle})
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  defaultChecked={true}
                  onChange={(e) => {
                    setRemboursement(e.target.checked);
                  }}
                />
                <span>
                  Refléter cette enchère dans le total des fûts du cercle
                </span>
              </label>
              <Typography>
                {reemboursement && (
                  <>
                    Le cercle {enchereData.senderName} sera{" "}
                    {oldValue - value > 0 ? "remboursé" : "débité"}{" "}
                    {Math.abs(oldValue - value)} fûts
                  </>
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12}>
              <QuantityInput
                title="Enchère"
                defaultValue={value}
                min={0}
                max={1000000000}
                error={false}
                helpText={""}
                change={(_event: any, val: any) => {
                  console.log(val);
                  setValue(val);
                }}
              />
            </Grid>
            {!error ? (
              <>
                <Grid item xs={12} sm={12}>
                  <LoadingButton
                    size="large"
                    variant="contained"
                    fullWidth
                    onClick={close}
                    color={finished ? "success" : "error"}
                  >
                    {!finished
                      ? "Fermer"
                      : "Enchère mise à jour ! Fermer la fenêtre..."}
                  </LoadingButton>
                </Grid>
                {!finished && (
                  <Grid item xs={12} sm={12}>
                    <LoadingButton
                      size="large"
                      variant="contained"
                      fullWidth
                      onClick={handleEditEnchere}
                      loading={loading}
                    >
                      Mettre à jour enchère
                    </LoadingButton>
                  </Grid>
                )}
              </>
            ) : (
              <Grid item xs={12} sm={12}>
                <LoadingButton
                  size="large"
                  variant="contained"
                  fullWidth
                  onClick={close}
                  color={"error"}
                >
                  Error, Fermer
                </LoadingButton>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </>
  );
}
