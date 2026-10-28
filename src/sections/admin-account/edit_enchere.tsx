import FormActions from "../../components/account/form-actions";
import { getEditionData } from "../../data/edition-data";
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
      const ret = await editEnchereAmount(
        reemboursement,
        data,
        enchereData.id,
        value,
      );
      if (ret !== 0) {
        setError("Error updating enchere.");
        return;
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
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 48,
                }}
              >
                <input
                  type="checkbox"
                  style={{ width: 20, height: 20, flexShrink: 0 }}
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
                min={(getEditionData(data) ?? {}).enchereMin}
                max={(getEditionData(data) ?? {}).enchereMax}
                error={false}
                helpText={""}
                change={(_event: any, val: any) => {
                  console.log(val);
                  setValue(val);
                }}
              />
            </Grid>
            <FormActions
              error={error || (finished ? "Enchère mise à jour." : "")}
              severity={finished ? "success" : "error"}
            >
              <LoadingButton variant="outlined" color="inherit" onClick={close}>
                {finished ? "Fermer" : "Annuler"}
              </LoadingButton>
              {!finished && (
                <LoadingButton
                  variant="contained"
                  loading={loading}
                  onClick={handleEditEnchere}
                >
                  Mettre à jour enchère
                </LoadingButton>
              )}
            </FormActions>
          </Grid>
        </CardContent>
      </Card>
    </>
  );
}
