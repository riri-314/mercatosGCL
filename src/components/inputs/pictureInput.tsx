import { Button, FormHelperText, Grid } from "@mui/material";
import React from "react";
import ImageUploading, { ImageListType } from "react-images-uploading";

export default function PictureInput() {
  const [images, setImages] = React.useState([]);
  const maxNumber = 1;

  const onChange = (
    imageList: ImageListType,
  ) => {
    // data for submit
    console.log("onchange: ", imageList);
    setImages(imageList as never[]);
  };

  return (
    <Grid item xs={12} sm={12}>
      <ImageUploading
        multiple
        value={images}
        onChange={onChange}
        maxNumber={maxNumber}
        acceptType={["gif", "png"]}
        maxFileSize={2500000}
      >
        {({
          imageList,
          onImageUpload,
          onImageRemove,
          isDragging,
          dragProps,
          errors,
        }) => (
          // write your building UI
          <div className="upload__image-wrapper">
            <Button
              variant="outlined"
              size="large"
              sx={{ width: "100%" }}
              style={isDragging ? { color: "red" } : undefined}
              onClick={onImageUpload}
              {...dragProps}
            >
              Click ou glisse une image ici
            </Button>
            {imageList.map((image, index) => (
              <>
                &nbsp;
                <div
                  key={index}
                  className="image-item"
                  style={{ width: "100%" }}
                >
                  <img
                    src={image.dataURL}
                    alt=""
                    width="100"
                    style={{ width: "100%" }}
                  />
                  <div className="image-item__btn-wrapper">
                    <Button
                      onClick={() => onImageRemove(index)}
                      variant="outlined"
                      size="large"
                      sx={{ width: "100%", mt: 2 }}
                    >
                      {" "}
                      Retirer image{" "}
                    </Button>
                  </div>
                </div>
              </>
            ))}
            <FormHelperText>
              Photo du comitard. Formats supporté: png, jpg, gif. Max 2.5MB
            </FormHelperText>
            {errors && (
              <div>
                {errors?.maxNumber && (
                  <FormHelperText>
                    Nombre d'images selectionnées depasse le maximum autorisé
                  </FormHelperText>
                )}
                {errors?.acceptType && (
                  <FormHelperText>
                    Format de fichier non supporté
                  </FormHelperText>
                )}
                {errors?.maxFileSize && (
                  <FormHelperText>Taille de fichier trop grande</FormHelperText>
                )}
                {errors?.resolution && (
                  <FormHelperText>Résolution trop grande</FormHelperText>
                )}
              </div>
            )}
          </div>
        )}
      </ImageUploading>
    </Grid>
  );
}
