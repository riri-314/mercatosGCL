import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { products } from 'src/_mock/products';

import ProductCard from '../product-card';
import { useAuth } from "src/auth/AuthProvider";


// ----------------------------------------------------------------------

export default function ProductsView() {
  const user = useAuth();


  return (
    <Container>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Comitards
      </Typography>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid key={product.id} xs={6} sm={6} md={3}>
            <ProductCard product={product} loged={user? true:false} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

