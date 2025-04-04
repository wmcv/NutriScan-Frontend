import { Divider, Grid, GridItem } from "@chakra-ui/react";
import NavBar from "./components/NavBar";
import { useEffect, useState } from "react";
import MenuFrame from "./components/MenuFrame";
import CameraFeed from "./components/CameraFeed";
import { fetchProduct } from "./utils/fetchProduct";
import ProductInfo from "./components/ProductInfo";
import { analyzeProduct } from "./utils/analyzeProduct";
import { getUserPreferences } from "./utils/getUserPreferences";
import AIInfo from "./components/AIInfo";

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [barcode, setBarcode] = useState("empty");
  const [AIMessage, setAIMessage] = useState("empty");
  const [productName, setProductName] = useState("Product");
  const [productIngredients, setProductIngredients] = useState("Ingredients");
  const [productNutrients, setproductNutrients] = useState<{
    energy_kcal: number;
    fat: number;
    saturated_fat: number;
    trans_fat: number;
    cholesterol: number;
    carbohydrates: number;
    sugars: number;
    fiber: number;
    proteins: number;
    salt: number;
    sodium: number;
    iron: number;
    calcium: number;
  } | null>(null);

  useEffect(() => {
    const getInfo = async () => {
      if (barcode && barcode !== "empty") {
        const product = await fetchProduct(barcode);
        const product_name = product.product_name;
        setProductName(product_name || "Name");
        const ingredients =
          product.ingredients_text || "No ingredients available";
        setProductIngredients(ingredients);
        const nutriments = product.nutriments || {};
        const nutrients = {
          energy_kcal: nutriments["energy-kcal"] || 0,
          fat: nutriments.fat || 0,
          saturated_fat: nutriments["saturated-fat"] || 0,
          trans_fat: nutriments["trans-fat"] || 0,
          cholesterol: nutriments.cholesterol || 0,
          carbohydrates: nutriments.carbohydrates || 0,
          sugars: nutriments.sugars || 0,
          fiber: nutriments.fiber || 0,
          proteins: nutriments.proteins || 0,
          salt: nutriments.salt || 0,
          sodium: nutriments.sodium || 0,
          iron: nutriments.iron || 0,
          calcium: nutriments.calcium || 0,
        };
        setproductNutrients(nutrients);

        const preferences = await getUserPreferences();
        console.log(preferences);
        if (preferences) {
          const aiMsg = await analyzeProduct(
            product_name,
            ingredients,
            nutrients || {},
            preferences
          );
          setAIMessage(aiMsg);
        }
      }
    };

    getInfo();
  }, [barcode]);

  return (
    <Grid templateAreas={`"nav" "cam" "divider1" "AI" "divider2" "info"`}>
      {/* Navigation Bar */}
      <GridItem area="nav">
        <NavBar toggleSettings={setSettingsOpen} settingsOpen={settingsOpen} />
        {settingsOpen && <MenuFrame setMenuOpen={setSettingsOpen} />}
      </GridItem>

      {/* Camera Feed */}
      <GridItem area="cam">
        <CameraFeed updateBarcode={setBarcode} />
      </GridItem>

      {/* Divider between Camera and AI Info */}
      <GridItem area="divider1">
        <Divider borderColor="gray.300" my={2} />
      </GridItem>

      {/* AI Info */}
      <GridItem area="AI">
        <AIInfo aiResponse={AIMessage} />
      </GridItem>

      {/* Divider between AI Info and Product Info */}
      <GridItem area="divider2">
        <Divider borderColor="gray.300" my={2} />
      </GridItem>

      {/* Product Info */}
      <GridItem area="info">
        <ProductInfo
          productName={productName}
          productIngredients={productIngredients}
          productNutrients={productNutrients || {}}
        />
      </GridItem>
    </Grid>
  );
}

export default App;
