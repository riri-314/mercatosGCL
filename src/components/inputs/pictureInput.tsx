import { Button, FormHelperText } from "@mui/material";
import imageCompression from "browser-image-compression";
import { useState } from "react";
import ImageUploading, {
  ImageListType,
  ImageType,
} from "react-images-uploading";

interface PictureInputProps {
  change: (images: ImageType[]) => void;
  error: boolean;
  upload: number | undefined;
}

export default function PictureInput({ change, error, upload }: PictureInputProps) {
  const [images, setImages] = useState<ImageType[]>([]);
  const [progress, setProgress] = useState(0);
  const maxNumber = 1;
  const maxFileSize = 5500000; // Bytes
  const maxFileSizeCompressed = 0.1; // MBytes

  const onChange = async (imageList: ImageListType) => {
    // data for submit

    // Compress the newly added image before setting it in the state
    const compressedImages = await Promise.all(
      imageList.map(async (image) => {
        const options = {
          maxSizeMB: maxFileSizeCompressed,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (progress: number) => {
            console.log("Progress: ", progress);
            setProgress(progress);
          },
        };
        try {
          if (image.file) {
            const compressedFile = await imageCompression(image.file, options);
            // Rest of the code...
            return {
              ...image,
              dataURL: URL.createObjectURL(compressedFile),
              file: compressedFile,
            };
          }
        } catch (error) {
          console.log(error);
          return image; // If compression fails, use the original image
        }
      })
    );
    console.log("onchange: ", compressedImages);
    if (compressedImages[0]) {
      setImages([compressedImages[0]]);
      change([compressedImages[0]]);
    } else {
      setProgress(0);
      setImages([]);
      change([]);
    }
  };

  return (
    <ImageUploading
      multiple
      value={images}
      onChange={onChange}
      maxNumber={maxNumber}
      acceptType={["gif", "png", "jpg", "jpeg", "webp"]}
      maxFileSize={maxFileSize}
    >
      {({ onImageUpload, onImageRemove, isDragging, dragProps, errors }) => (
        // write your building UI
        <div className="upload__image-wrapper">
          {(images.length == 0 && progress == 0) && (
            <>
              <Button
                variant="outlined"
                size="large"
                sx={{ width: "100%" }}
                style={isDragging ? { color: "red" } : undefined}
                onClick={onImageUpload}
                {...dragProps}
                color={error ? "error" : "primary"}
              >
                Click ou glisse une image ici
              </Button>
              <FormHelperText>
                Photo du comitard. Formats supporté: png, jpg, gif. Max{" "}
                {maxFileSize / 1000000}MB
              </FormHelperText>
            </>
          )}
          {images.length === 0 && progress !== 0 && progress !== 100 && (
            <div className="progress" style={{ textAlign: "center" }}>
              Compression de l'image: {progress}%
            </div>
            
          )}
          {images.map((image, index) => (
            <>
              &nbsp;
              <div key={index} className="image-item" style={{ width: "100%" }}>
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
                    disabled={upload !== undefined}
                  >
                    {upload !== undefined ? `En cours d'upload: ${upload.toFixed(2)}%` : "Supprimer image"}
                  </Button>
                </div>
              </div>
            </>
          ))}

          {errors && (
            <div>
              {errors?.maxNumber && (
                <FormHelperText sx={{color: "red"}}>
                  Nombre d'images selectionnées depasse le maximum autorisé
                </FormHelperText>
              )}
              {errors?.acceptType && (
                <FormHelperText sx={{color: "red"}}>Format de fichier non supporté</FormHelperText>
              )}
              {errors?.maxFileSize && (
                <FormHelperText sx={{color: "red"}}>Taille de fichier trop grande</FormHelperText>
              )}
              {errors?.resolution && (
                <FormHelperText sx={{color: "red"}}>Résolution trop grande</FormHelperText>
              )}
            </div>
          )}
        </div>
      )}
    </ImageUploading>
  );
}
