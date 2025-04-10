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
import { supabase } from "./supabaseClient";
import { Challenge } from "./types";
import { analyzeChallenge } from "./utils/analyzeChallenge";
import TempPopup from "./components/TempPopup";
import ProfileFrame from "./components/ProfileFrame";
import BadgePopup from "./components/BadgePopup";

function App() {
  const [popupMessages, setPopupMessages] = useState<
    {
      message: string;
      countPre: number;
      countPost: number;
      countTotal: number;
    }[]
  >([]);

  const showTempPopup = (
    message: string,
    countPre: number,
    countPost: number,
    countTotal: number
  ) => {
    const index = popupMessages.length;
    setPopupMessages((prevMessages) => [
      ...prevMessages,
      { message, index, countPre, countPost, countTotal },
    ]);

    setTimeout(() => {
      setPopupMessages((prevMessages) =>
        prevMessages.filter((popup) => popup.message !== message)
      );
    }, 3000);
  };

  const [popupBadges, setPopupBadges] = useState<{ id: number }[]>([]);

  const showBadgePopup = (id: number) => {
    const index = popupMessages.length + popupBadges.length;
    setPopupBadges((prevBadges) => [...prevBadges, { id, index }]);

    setTimeout(() => {
      setPopupBadges((prevBadges) =>
        prevBadges.filter((popup) => popup.id !== id)
      );
    }, 3000);
  };

  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [barcode, setBarcode] = useState("empty");
  const [AIMessage, setAIMessage] = useState("empty");
  const [productName, setProductName] = useState("Product");
  const [servingSize, setServingSize] = useState("Serving Size");
  const [productIngredients, setProductIngredients] = useState("Ingredients");
  const [ecoscoreGrade, setEcoscoreGrade] = useState("NaN");
  const [foodGroups, setFoodGroups] = useState("NaN");
  const [userChallenges, setUserChallenges] = useState<number[]>([]);
  const [userCompleted, setUserCompleted] = useState<number>(0);
  const [userProfileScans, setUserProfileScans] = useState<number>(0);
  const [userProfileBadges, setUserProfileBadges] = useState<number[]>([0]);
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
    potassium: number;
    salt: number;
    sodium: number;
    iron: number;
    calcium: number;
  } | null>(null);

  const [productUnits, setproductUnits] = useState<{
    energy_kcal: string;
    fat: string;
    saturated_fat: string;
    trans_fat: string;
    cholesterol: string;
    carbohydrates: string;
    sugars: string;
    fiber: string;
    proteins: string;
    potassium: string;
    salt: string;
    sodium: string;
    iron: string;
    calcium: string;
  } | null>(null);

  useEffect(() => {
    const loadWeeklyChallenges = async () => {
      const { data, error } = await supabase
        .from("WeeklyChallenges")
        .select("*");
      if (error) {
        console.error("Error fetching weekly challenges:", error);
      } else {
        setWeeklyChallenges(data);
      }
    };

    const checkAndCreateUserChallenges = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user && !error) {
        const userId = user.id;

        const { data, error: checkError } = await supabase
          .from("WeeklyChallengesUsers")
          .select("*")
          .eq("user_id", userId)
          .single();

        console.log(data);
        if (checkError && checkError.code === "PGRST116") {
          const { error: insertError } = await supabase
            .from("WeeklyChallengesUsers")
            .upsert(
              [
                {
                  user_id: userId,
                  challenge1: 0,
                  challenge2: 0,
                  challenge3: 0,
                  challenge4: 0,
                  challenge5: 0,
                  completed: 0,
                },
              ],
              { onConflict: "user_id" }
            );

          if (insertError) {
            console.error("Error creating new row for user:", insertError);
          } else {
            console.log("New row created for user:", userId);
          }
        } else if (checkError) {
          console.error("Error checking for existing user row:", checkError);
        } else {
          console.log("User already has a row in WeeklyChallengesUsers");
        }
      }
    };

    const checkAndCreateProfile = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user && !error) {
        const userId = user.id;

        const { data, error: checkError } = await supabase
          .from("Profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        console.log(data);
        if (checkError && checkError.code === "PGRST116") {
          const { error: insertError } = await supabase.from("Profiles").upsert(
            [
              {
                user_id: userId,
                scan_count: 0,
                badges: [
                  0,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                ],
              },
            ],
            { onConflict: "user_id" }
          );

          if (insertError) {
            console.error("Error creating new row for user:", insertError);
          } else {
            console.log("New row created for user:", userId);
          }
        } else if (checkError) {
          console.error("Error checking for existing user row:", checkError);
        } else {
          console.log("User already has a row in Profiles");
        }
      }
    };

    const loadChallengeData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!user || error) return;

      const userId = user.id;

      const { data, error: fetchError } = await supabase
        .from("WeeklyChallengesUsers")
        .select(
          "challenge1, challenge2, challenge3, challenge4, challenge5, completed"
        )
        .eq("user_id", userId)
        .single();

      if (fetchError || !data) {
        console.error("Failed to fetch challenge progress", fetchError);
        return;
      }

      const loadChallengeProgress = [
        data.challenge1 || 0,
        data.challenge2 || 0,
        data.challenge3 || 0,
        data.challenge4 || 0,
        data.challenge5 || 0,
      ];

      const loadChallengeComplete = data.completed || 0;

      setUserChallenges(loadChallengeProgress);
      setUserCompleted(loadChallengeComplete);
    };

    const loadProfileData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!user || error) return;

      const userId = user.id;

      const { data, error: fetchError } = await supabase
        .from("Profiles")
        .select("scan_count, badges")
        .eq("user_id", userId)
        .single();

      if (fetchError || !data) {
        console.error("Failed to fetch profile data", fetchError);
        return;
      }

      const loadProfileScans = data.scan_count || 0;
      const loadProfileBadges = data.badges || [0];
      console.log("info");
      console.log(loadProfileScans);
      console.log(loadProfileBadges);
      setUserProfileScans(loadProfileScans);
      setUserProfileBadges(loadProfileBadges);
    };
    loadProfileData();
    loadWeeklyChallenges();
    checkAndCreateUserChallenges();
    checkAndCreateProfile();
    loadChallengeData();
  }, []);

  useEffect(() => {
    if (barcode === "empty") return;
    const scans = userProfileScans + 1;
    const badges = userProfileBadges;
    const challengeCount = userCompleted;
    const orderChange = [0];

    if (!badges.includes(1) && scans >= 1) {
      badges[1] = 1;
      orderChange[0] = 1;
      showBadgePopup(1);
    } else if (!badges.includes(2) && scans >= 5) {
      badges[2] = 2;
      orderChange[0] = 1;
      showBadgePopup(2);
    } else if (!badges.includes(3) && scans >= 10) {
      badges[3] = 3;
      orderChange[0] = 1;
      showBadgePopup(3);
    } else if (!badges.includes(4) && scans >= 25) {
      badges[4] = 4;
      orderChange[0] = 1;
      showBadgePopup(4);
    } else if (!badges.includes(5) && scans >= 50) {
      badges[5] = 5;
      orderChange[0] = 1;
      showBadgePopup(5);
    } else if (!badges.includes(6) && scans >= 75) {
      badges[6] = 6;
      orderChange[0] = 1;
      showBadgePopup(6);
    } else if (!badges.includes(7) && scans >= 100) {
      badges[7] = 7;
      orderChange[0] = 1;
      showBadgePopup(7);
    } else if (!badges.includes(8) && scans >= 150) {
      badges[8] = 8;
      orderChange[0] = 1;
      showBadgePopup(8);
    } else if (!badges.includes(9) && scans >= 200) {
      badges[9] = 9;
      orderChange[0] = 1;
      showBadgePopup(9);
    } else if (!badges.includes(10) && scans >= 250) {
      badges[10] = 10;
      orderChange[0] = 1;
      showBadgePopup(10);
    } else if (!badges.includes(11) && scans >= 500) {
      badges[11] = 11;
      orderChange[0] = 1;
      showBadgePopup(11);
    } else if (!badges.includes(12) && scans >= 1000) {
      badges[12] = 12;
      orderChange[0] = 1;
      showBadgePopup(12);
    } else if (!badges.includes(13) && challengeCount >= 1) {
      badges[13] = 13;
      orderChange[0] = 1;
      showBadgePopup(13);
    } else if (!badges.includes(14) && challengeCount >= 3) {
      badges[14] = 14;
      orderChange[0] = 1;
      showBadgePopup(14);
    } else if (!badges.includes(15) && challengeCount >= 5) {
      badges[15] = 15;
      orderChange[0] = 1;
      showBadgePopup(15);
    } else if (!badges.includes(16) && challengeCount >= 10) {
      badges[16] = 16;
      orderChange[0] = 1;
      showBadgePopup(16);
    } else if (!badges.includes(17) && challengeCount >= 15) {
      badges[17] = 17;
      orderChange[0] = 1;
      showBadgePopup(17);
    } else if (!badges.includes(18) && challengeCount >= 25) {
      badges[18] = 18;
      orderChange[0] = 1;
      showBadgePopup(18);
    } else if (!badges.includes(19) && challengeCount >= 50) {
      badges[19] = 19;
      orderChange[0] = 1;
      showBadgePopup(19);
    }

    if (orderChange[0] === 1) {
      const updateProfile = async () => {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!user || error) return;

        const userId = user.id;
        await supabase.from("Profiles").upsert(
          [
            {
              user_id: userId,
              scan_count: scans || 0,
              badges: badges || [0],
            },
          ],
          { onConflict: "user_id" }
        );
      };
      updateProfile();
    }
    setUserProfileScans(scans);
    setUserProfileBadges(badges);
  }, [barcode]);

  useEffect(() => {
    const getInfo = async () => {
      if (barcode && barcode !== "empty") {
        const product = await fetchProduct(barcode);
        const product_name =
          product.product_name_en || product.product_name || "NaN";
        setProductName(product_name || "NaN");
        const ingredients = product.ingredients_text || "NaN";
        setProductIngredients(ingredients);
        const servingsize = product.serving_size || "NaN";
        setServingSize(servingsize);

        const ecoscoregrade = product.ecoscore_grade || "NaN";
        setEcoscoreGrade(ecoscoregrade);
        const foodgroups = product.food_groups || "NaN";
        setFoodGroups(foodgroups);

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
          potassium:
            nutriments["potassium_100g"] ||
            nutriments["potassium_serving"] ||
            nutriments["potassium"] ||
            0,
          salt: nutriments.salt || 0,
          sodium: nutriments.sodium || 0,
          iron: nutriments.iron || 0,
          calcium: nutriments.calcium || 0,
        };

        const units = {
          energy_kcal: "kcal",
          fat: nutriments["fat_unit"] || "g",
          saturated_fat: nutriments["saturated-fat_unit"] || "g",
          trans_fat: nutriments["trans-fat_unit"] || "g",
          cholesterol: nutriments["cholesterol_unit"] || "g",
          carbohydrates: nutriments["carbohydrates_unit"] || "g",
          sugars: nutriments["sugars_unit"] || "g",
          fiber: nutriments["fiber_unit"] || "g",
          proteins: nutriments["proteins_unit"] || "g",
          potassium: nutriments["potassium_unit"] || "g",
          salt: nutriments["salt_unit"] || "g",
          sodium: nutriments["sodium_unit"] || "g",
          iron: nutriments["iron_unit"] || "g",
          calcium: nutriments["calcium_unit"] || "g",
        };
        setproductUnits(units);
        setproductNutrients(nutrients);

        const challengeList: { [key: number]: string } = {
          "0": "challenge1",
          "1": "challenge2",
          "2": "challenge3",
          "3": "challenge4",
          "4": "challenge5",
        };

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!user || error) return;

        const userId = user.id;

        const { data, error: fetchError } = await supabase
          .from("WeeklyChallengesUsers")
          .select(
            "challenge1, challenge2, challenge3, challenge4, challenge5, completed"
          )
          .eq("user_id", userId)
          .single();

        if (fetchError || !data) {
          console.error("Failed to fetch challenge progress", fetchError);
          return;
        }

        const updatedChallengeProgress = [
          data.challenge1 || 0,
          data.challenge2 || 0,
          data.challenge3 || 0,
          data.challenge4 || 0,
          data.challenge5 || 0,
          data.completed || 0,
        ];
        const copiedUpdatedChallengeProgress = updatedChallengeProgress.slice(
          0,
          5
        );

        console.log("take1");
        console.log(updatedChallengeProgress);
        console.log("take2");
        const tempCompleted = [0, 0, 0, 0, 0];

        await Promise.all(
          weeklyChallenges.map(async (challenge, index) => {
            const [challenge_amount] = challenge.name.split("#");
            const challengeAmount = parseFloat(challenge_amount);
            const [challengeProgress, completedProgresss] =
              await analyzeChallenge(
                challenge.criteria,
                challenge.value,
                challengeList[index],
                updatedChallengeProgress,
                challengeAmount,
                nutrients,
                units
              );
            // SPREAD OUT COMPLETED INTO ARRAY THEN ADD ALL TOGEHTER IN THE END
            // Update the challenge progress in the copied array

            updatedChallengeProgress[index] += challengeProgress;
            tempCompleted[index] = completedProgresss;
          })
        );

        const copyChallengeProgress = updatedChallengeProgress.slice(0, 5);
        const totalCompleted: number =
          tempCompleted.reduce((acc, val) => acc + val, 0) +
          updatedChallengeProgress[5];
        setUserChallenges(copyChallengeProgress || []);
        setUserCompleted(totalCompleted || 0);

        const updateDatabase = async () => {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();
          if (!user || error) return;

          const userId = user.id;
          console.log(updatedChallengeProgress);
          await supabase.from("WeeklyChallengesUsers").upsert(
            [
              {
                user_id: userId,
                challenge1: copyChallengeProgress[0] || 0,
                challenge2: copyChallengeProgress[1] || 0,
                challenge3: copyChallengeProgress[2] || 0,
                challenge4: copyChallengeProgress[3] || 0,
                challenge5: copyChallengeProgress[4] || 0,
                completed: totalCompleted || 0,
              },
            ],
            { onConflict: "user_id" }
          );
        };

        const updateProfile = async () => {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();
          if (!user || error) return;

          const userId = user.id;
          await supabase.from("Profiles").upsert(
            [
              {
                user_id: userId,
                scan_count: userProfileScans || 0,
                badges: userProfileBadges || [0],
              },
            ],
            { onConflict: "user_id" }
          );
        };
        updateProfile();

        if (
          copyChallengeProgress[0] - copiedUpdatedChallengeProgress[0] ===
          1
        ) {
          const chalName = weeklyChallenges[0].name;
          const [strTotalCount, filteredName] = chalName.split("#");
          const totalCount = parseFloat(strTotalCount);
          showTempPopup(
            filteredName,
            copiedUpdatedChallengeProgress[0],
            copyChallengeProgress[0],
            totalCount
          );
        } else if (
          copyChallengeProgress[1] - copiedUpdatedChallengeProgress[1] ===
          1
        ) {
          const chalName = weeklyChallenges[1].name;
          const [strTotalCount, filteredName] = chalName.split("#");
          const totalCount = parseFloat(strTotalCount);
          showTempPopup(
            filteredName,
            copiedUpdatedChallengeProgress[1],
            copyChallengeProgress[1],
            totalCount
          );
        } else if (
          copyChallengeProgress[2] - copiedUpdatedChallengeProgress[2] ===
          1
        ) {
          const chalName = weeklyChallenges[2].name;
          const [strTotalCount, filteredName] = chalName.split("#");
          const totalCount = parseFloat(strTotalCount);
          showTempPopup(
            filteredName,
            copiedUpdatedChallengeProgress[2],
            copyChallengeProgress[2],
            totalCount
          );
        } else if (
          copyChallengeProgress[3] - copiedUpdatedChallengeProgress[3] ===
          1
        ) {
          const chalName = weeklyChallenges[3].name;
          const [strTotalCount, filteredName] = chalName.split("#");
          const totalCount = parseFloat(strTotalCount);
          showTempPopup(
            filteredName,
            copiedUpdatedChallengeProgress[3],
            copyChallengeProgress[3],
            totalCount
          );
        } else if (
          copyChallengeProgress[4] - copiedUpdatedChallengeProgress[4] ===
          1
        ) {
          const chalName = weeklyChallenges[4].name;
          const [strTotalCount, filteredName] = chalName.split("#");
          const totalCount = parseFloat(strTotalCount);
          showTempPopup(
            filteredName,
            copiedUpdatedChallengeProgress[4],
            copyChallengeProgress[4],
            totalCount
          );
        }

        updateDatabase();

        //
        //
        //
        //
        //
        //

        const preferences = await getUserPreferences();
        //console.log(preferences);
        if (preferences) {
          const aiMsg = await analyzeProduct(
            product_name,
            ingredients,
            ecoscoreGrade,
            foodGroups,
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
    <div>
      {popupBadges.map((popup, index) => (
        <BadgePopup
          key={index}
          id={popup.id}
          onClose={() => {}}
          index={index}
        />
      ))}

      {popupMessages.map((popup, index) => (
        <TempPopup
          key={index}
          message={popup.message}
          onClose={() => {}}
          index={index}
          countPre={popup.countPre}
          countPost={popup.countPost}
          countTotal={popup.countTotal}
        />
      ))}
      <Grid templateAreas={`"nav" "cam" "divider1" "AI" "divider2" "info"`}>
        <GridItem area="nav">
          <NavBar
            toggleSettings={setSettingsOpen}
            settingsOpen={settingsOpen}
            toggleProfile={setProfileOpen}
            profileOpen={profileOpen}
          />
          {profileOpen && (
            <ProfileFrame
              setProfileOpen={setProfileOpen}
              userChallenge={userChallenges}
              userCompleted={userCompleted}
              challenges={weeklyChallenges}
              userProfileScans={userProfileScans}
              userProfileBadges={userProfileBadges}
            />
          )}
          {settingsOpen && <MenuFrame setMenuOpen={setSettingsOpen} />}
        </GridItem>
        <GridItem area="cam">
          <CameraFeed updateBarcode={setBarcode} />
        </GridItem>
        <GridItem area="divider1">
          <Divider borderColor="gray.300" my={2} />
        </GridItem>
        <GridItem area="AI">
          <AIInfo aiResponse={AIMessage} />
        </GridItem>
        <GridItem area="divider2">
          <Divider borderColor="gray.300" my={2} />
        </GridItem>
        <GridItem area="info">
          <ProductInfo
            productName={productName}
            servingSize={servingSize}
            productIngredients={productIngredients}
            productNutrients={productNutrients || {}}
            productUnits={productUnits || {}}
          />
        </GridItem>
      </Grid>
    </div>
  );
}

export default App;
