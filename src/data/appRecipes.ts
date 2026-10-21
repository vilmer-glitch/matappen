import type { Unit } from '../lib/constants'
import type { RecipeUnit } from '../lib/recipeUnits'

// The app's built-in recipes. Every recipe here is based on a real, tested recipe from the linked source:
// ingredients and amounts come from the source, the instructions are written in our own words.
// Adding or changing a recipe only needs a push – no SQL.

export type AppIngredient = {
  // Name of the pantry item. A user's item with this name (or one of the aliases) is used if it exists.
  name: string
  aliases?: string[]
  // Where a new item ends up, and its locked unit (not for staples)
  group: 'fridge' | 'pantry' | 'staple'
  unit?: Unit
  quantity: number | null
  recipeUnit: RecipeUnit | null
}

export type AppRecipe = {
  key: string
  name: string
  servings: number
  time: string
  source: { name: string; url: string }
  instructions: string
  note?: string
  ingredients: AppIngredient[]
}

// Shared ingredients, so the same item is described the same way in every recipe
const salt: AppIngredient = { name: 'Salt', group: 'staple', quantity: null, recipeUnit: null }
const pepper = (quantity: number | null = null, recipeUnit: RecipeUnit | null = null): AppIngredient => ({
  name: 'Svartpeppar',
  group: 'staple',
  quantity,
  recipeUnit,
})
const stock = (quantity: number | null, recipeUnit: RecipeUnit | null): AppIngredient => ({
  name: 'Buljong',
  group: 'staple',
  quantity,
  recipeUnit,
})
const butter = (quantity: number, recipeUnit: RecipeUnit): AppIngredient => ({
  name: 'Smör',
  group: 'staple',
  quantity,
  recipeUnit,
})
const cream = (quantity: number): AppIngredient => ({
  name: 'Grädde',
  aliases: ['Vispgrädde'],
  group: 'fridge',
  unit: 'dl',
  quantity,
  recipeUnit: 'dl',
})
const soy = (quantity: number): AppIngredient => ({
  name: 'Soja',
  aliases: ['Japansk soja', 'Kinesisk soja'],
  group: 'pantry',
  unit: 'ml',
  quantity,
  recipeUnit: 'tbsp',
})
const onion = (quantity: number): AppIngredient => ({
  name: 'Gul lök',
  aliases: ['Lök'],
  group: 'pantry',
  unit: 'pcs',
  quantity,
  recipeUnit: 'pcs',
})
const garlic = (cloves: number): AppIngredient => ({
  name: 'Vitlök',
  group: 'pantry',
  unit: 'pcs',
  quantity: cloves,
  recipeUnit: 'pcs',
})
const mushrooms: AppIngredient = {
  name: 'Champinjoner',
  group: 'fridge',
  unit: 'g',
  quantity: 250,
  recipeUnit: 'g',
}

export const APP_RECIPES: AppRecipe[] = [
  {
    key: 'potatis-purjoloksoppa',
    name: 'Krämig potatis- och purjolökssoppa',
    servings: 4,
    time: 'Under 30 min',
    source: { name: 'ICA', url: 'https://www.ica.se/recept/kramig-potatis-och-purjolokssoppa-716077/' },
    instructions: `1. Skala potatisen och skiva den. Skölj och ansa purjolöken och skär den i strimlor.
2. Fräs purjolöken mjuk i oljan i en stor kastrull.
3. Lägg i potatis, timjan och buljong. Låt koka ca 15 minuter, tills potatisen är mjuk.
4. Mixa soppan slät med en stavmixer.
5. Rör ner grädden och låt soppan koka upp igen.
6. Smaka av med salt och peppar.`,
    note: 'Gott med bröd, stekt bacon och hackad persilja.',
    ingredients: [
      { name: 'Potatis', group: 'pantry', unit: 'g', quantity: 600, recipeUnit: 'g' },
      { name: 'Purjolök', group: 'fridge', unit: 'pcs', quantity: 1, recipeUnit: 'pcs' },
      { name: 'Rapsolja', aliases: ['Olivolja'], group: 'staple', quantity: 1, recipeUnit: 'tbsp' },
      { name: 'Timjan', group: 'staple', quantity: 1, recipeUnit: 'tsp' },
      stock(10, 'dl'),
      cream(3),
      salt,
      pepper(),
    ],
  },
  {
    key: 'flaskytterfile-sockerkaksform',
    name: 'Fläskytterfilé i sockerkaksform',
    servings: 4,
    time: '1 h 45 min',
    source: { name: 'Kokaihop', url: 'https://www.kokaihop.se/recept/flaskytterfile-i-sockerkaksform' },
    instructions: `1. Sätt ugnen på 175°. Skär bort fett, hinnor och senor från filén.
2. Lägg filén i en långsmal sockerkaksform.
3. Blanda 3 dl grädde, lingonsylt, soja, smulad buljongtärning, salt och peppar. Häll över köttet.
4. Låt stå i ugnen ca 90 minuter. Ös lite av vätskan över köttet några gånger.
5. Ta ut köttet, linda in det i folie och låt det vila.
6. Sila vätskan från formen ner i en kastrull, häll i 1 dl grädde och koka upp.
7. Vispa ut mjölet i 1 dl kallt vatten, rör ner i såsen och låt koka några minuter. Späd med vatten om den blir för tjock.
8. Skiva köttet och häll den varma såsen över precis innan servering.`,
    note: 'Servera med kokt potatis, potatismos eller ris och en sallad.',
    ingredients: [
      { name: 'Fläskytterfilé', group: 'fridge', unit: 'pcs', quantity: 1, recipeUnit: 'pcs' },
      cream(4),
      { name: 'Lingonsylt', group: 'fridge', unit: 'dl', quantity: 1, recipeUnit: 'dl' },
      stock(1, 'pcs'),
      soy(2),
      { name: 'Salt', group: 'staple', quantity: 0.5, recipeUnit: 'tsp' },
      pepper(0.5, 'tsp'),
      { name: 'Vetemjöl', group: 'staple', quantity: 2.5, recipeUnit: 'tbsp' },
    ],
  },
  {
    key: 'thaigryta-kyckling-kokosmjolk',
    name: 'Thaigryta med kyckling och kokosmjölk',
    servings: 4,
    time: '40 min',
    source: { name: 'Bong', url: 'https://bongtouchoftaste.se/recept/thaigryta-med-kyckling-och-kokosmjolk/' },
    instructions: `1. Skär kycklingen i mindre bitar och bryn dem i oljan. Lägg åt sidan.
2. Fräs lök, vitlök, ingefära, salladslök, vattenkastanjer och paprika några minuter.
3. Lägg tillbaka kycklingen och häll i fond, kokosmjölk och sweet chilisås.
4. Låt sjuda ca 20 minuter, tills kycklingen är genomkokt.
5. Smaka av med salt, peppar, limesaft och mer fond om det behövs.`,
    note: 'Servera med nykokt ris.',
    ingredients: [
      { name: 'Kycklinglårfilé', aliases: ['Kyckling'], group: 'fridge', unit: 'g', quantity: 500, recipeUnit: 'g' },
      { name: 'Rapsolja', aliases: ['Olivolja'], group: 'staple', quantity: 2, recipeUnit: 'tbsp' },
      onion(1),
      garlic(3),
      { name: 'Ingefära', group: 'fridge', unit: 'g', quantity: 5, recipeUnit: 'g' },
      { name: 'Salladslök', group: 'fridge', unit: 'pcs', quantity: 3, recipeUnit: 'pcs' },
      { name: 'Vattenkastanjer', group: 'pantry', unit: 'dl', quantity: 1, recipeUnit: 'dl' },
      { name: 'Röd paprika', aliases: ['Paprika'], group: 'fridge', unit: 'pcs', quantity: 0.5, recipeUnit: 'pcs' },
      { name: 'Sweet chilisås', group: 'pantry', unit: 'ml', quantity: 2, recipeUnit: 'tbsp' },
      { name: 'Kokosmjölk', group: 'pantry', unit: 'ml', quantity: 4, recipeUnit: 'dl' },
      { name: 'Kycklingfond', group: 'pantry', unit: 'ml', quantity: 2, recipeUnit: 'tbsp' },
      { name: 'Lime', group: 'fridge', unit: 'pcs', quantity: 1, recipeUnit: 'pcs' },
      salt,
      pepper(),
    ],
  },
  {
    key: 'flaskkotlett-i-ugn',
    name: 'Fläskkotlett i ugn',
    servings: 4,
    time: '50 min',
    source: { name: 'Arla', url: 'https://www.arla.se/recept/flaskkotlett-i-ugn/' },
    instructions: `1. Sätt ugnen på 175° (160° varmluft). Koka riset enligt förpackningen.
2. Krydda kotletterna med salt och peppar på båda sidor. Dela champinjonerna i fyra delar.
3. Bryn kotletterna i smöret på hög värme och lägg dem i en ugnsform.
4. Stek champinjonerna i samma panna. Strö över mjölet och häll i grädde, soja och sambal oelek. Låt koka 2 minuter.
5. Häll såsen över kotletterna och låt stå i ugnen ca 30 minuter, tills köttet är 70° i mitten.
6. Strö hackad persilja över och servera.`,
    note: 'Servera med ris och en sallad på babyspenat, paprika och tomat.',
    ingredients: [
      { name: 'Fläskkotletter', group: 'fridge', unit: 'pcs', quantity: 4, recipeUnit: 'pcs' },
      { name: 'Salt', group: 'staple', quantity: 0.5, recipeUnit: 'tsp' },
      pepper(2, 'pinch'),
      mushrooms,
      butter(2, 'tbsp'),
      { name: 'Vetemjöl', group: 'staple', quantity: 1, recipeUnit: 'tbsp' },
      { name: 'Matlagningsgrädde', aliases: ['Grädde'], group: 'fridge', unit: 'dl', quantity: 5, recipeUnit: 'dl' },
      soy(2),
      { name: 'Sambal oelek', group: 'pantry', unit: 'ml', quantity: 2, recipeUnit: 'tsp' },
      { name: 'Persilja', group: 'fridge', unit: 'pcs', quantity: 1, recipeUnit: 'pcs' },
    ],
  },
  {
    key: 'rostad-tomatsoppa-vitloksbrod',
    name: 'Rostad tomatsoppa med vitlöksbröd',
    servings: 4,
    time: '1 h',
    source: { name: 'Köket', url: 'https://www.koket.se/rostad-tomatsoppa-med-vitloksbrod' },
    instructions: `1. Sätt ugnen på 200°.
2. Dela tomaterna och skala och klyfta rödlöken. Dela vitlöksklyftorna med skalet kvar.
3. Lägg allt i en ugnsform och ringla över olivoljan.
4. Rosta i ugnen 40–50 minuter, tills allt har fått färg.
5. Koka upp vattnet med buljongtärningarna i en kastrull.
6. Kläm ut den rostade vitlöken ur skalen. Lägg tomater, lök och vitlök i buljongen och låt koka några minuter.
7. Mixa soppan slät och rör ner grädden. Smaka av med salt och rikligt med svartpeppar.
8. Vitlöksbröd: skiva baguetten. Smält smöret med en riven vitlöksklyfta och persiljan. Stek brödskivorna gyllene i smöret på båda sidor och salta lätt.`,
    note: 'Toppa soppan med en klick gräddfil och färsk basilika.',
    ingredients: [
      { name: 'Kvisttomater', aliases: ['Tomater'], group: 'fridge', unit: 'g', quantity: 1000, recipeUnit: 'g' },
      garlic(7),
      { name: 'Rödlök', group: 'pantry', unit: 'pcs', quantity: 2, recipeUnit: 'pcs' },
      { name: 'Olivolja', aliases: ['Rapsolja'], group: 'staple', quantity: 2, recipeUnit: 'tbsp' },
      stock(2, 'pcs'),
      cream(1.5),
      { name: 'Baguette', group: 'pantry', unit: 'pcs', quantity: 0.5, recipeUnit: 'pcs' },
      butter(50, 'g'),
      { name: 'Persilja', group: 'fridge', unit: 'pcs', quantity: 0.5, recipeUnit: 'pcs' },
      salt,
      pepper(),
    ],
  },
  {
    key: 'flaskfilegryta-champinjoner',
    name: 'Fläskfilégryta med champinjoner',
    servings: 4,
    time: 'Under 45 min',
    source: { name: 'ICA', url: 'https://www.ica.se/recept/flaskfilegryta-med-champinjoner-724256/' },
    instructions: `1. Skär fläskfilén i strimlor. Bryn dem i hälften av smöret och krydda med salt och peppar. Lägg åt sidan.
2. Hacka löken och dela champinjonerna. Stek dem i resten av smöret i en stor kastrull. Rör ner tomatpurén mot slutet och låt den fräsa en kort stund.
3. Smula ner buljongtärningen, häll i grädde och mjölk och koka upp.
4. Smaka av med soja, senap, salt och peppar.
5. Rör ut majsstärkelsen i lite kallt vatten och red av såsen.
6. Lägg tillbaka köttet och låt det bli varmt.`,
    note: 'Servera med ris eller kokt potatis och en sallad.',
    ingredients: [
      { name: 'Fläskfilé', aliases: ['Fläskytterfilé'], group: 'fridge', unit: 'g', quantity: 500, recipeUnit: 'g' },
      butter(2, 'tbsp'),
      onion(1),
      mushrooms,
      { name: 'Tomatpuré', group: 'pantry', unit: 'ml', quantity: 2, recipeUnit: 'tsp' },
      stock(1, 'pcs'),
      cream(3),
      { name: 'Mjölk', group: 'fridge', unit: 'l', quantity: 2, recipeUnit: 'dl' },
      soy(2),
      { name: 'Dijonsenap', group: 'pantry', unit: 'ml', quantity: 2, recipeUnit: 'tsp' },
      { name: 'Majsstärkelse', group: 'pantry', unit: 'ml', quantity: 1, recipeUnit: 'tsp' },
      salt,
      pepper(),
    ],
  },
  {
    key: 'salsicciapasta',
    name: 'Salsicciapasta',
    servings: 4,
    time: '30 min',
    source: { name: 'Arla', url: 'https://www.arla.se/recept/salsicciapasta/' },
    instructions: `1. Skiva schalottenlöken, moroten och fänkålen. Hacka vitlöken fint och dela tomaterna på mitten.
2. Smält smöret i en stor stekpanna och fräs grönsakerna, vitlöken och tomaterna i ca 5 minuter.
3. Snitta upp skinnet på korven och lägg köttet i pannan. Stek 4–5 minuter och dela det i mindre bitar under tiden.
4. Koka pastan enligt förpackningen.
5. Rör ner tomatpuré, chiliflakes, vin och grädde. Låt sjuda ca 10 minuter.
6. Smaka av med socker och salt och blanda ner den avrunna pastan.
7. Toppa med riven parmesan.`,
    note: 'Gott med hackad bladpersilja på toppen. Ta 1 tsk chiliflakes om du vill ha det starkare.',
    ingredients: [
      { name: 'Schalottenlök', group: 'pantry', unit: 'pcs', quantity: 1, recipeUnit: 'pcs' },
      { name: 'Morötter', group: 'fridge', unit: 'g', quantity: 100, recipeUnit: 'g' },
      { name: 'Fänkål', group: 'fridge', unit: 'pcs', quantity: 1, recipeUnit: 'pcs' },
      garlic(2),
      { name: 'Tomater', aliases: ['Cocktailtomater'], group: 'fridge', unit: 'g', quantity: 150, recipeUnit: 'g' },
      butter(25, 'g'),
      { name: 'Salsiccia', group: 'fridge', unit: 'g', quantity: 300, recipeUnit: 'g' },
      { name: 'Pasta', aliases: ['Rigatoni'], group: 'pantry', unit: 'g', quantity: 360, recipeUnit: 'g' },
      { name: 'Tomatpuré', group: 'pantry', unit: 'ml', quantity: 2, recipeUnit: 'tbsp' },
      { name: 'Chiliflakes', group: 'staple', quantity: 0.5, recipeUnit: 'tsp' },
      { name: 'Vitt vin', group: 'pantry', unit: 'ml', quantity: 0.5, recipeUnit: 'dl' },
      { name: 'Syrad grädde', group: 'fridge', unit: 'dl', quantity: 3, recipeUnit: 'dl' },
      { name: 'Strösocker', group: 'staple', quantity: 0.5, recipeUnit: 'tsp' },
      { name: 'Salt', group: 'staple', quantity: 1, recipeUnit: 'tsp' },
      { name: 'Parmesan', group: 'fridge', unit: 'g', quantity: 80, recipeUnit: 'g' },
    ],
  },
]
