import type { Unit } from '../lib/constants'

// Common groceries that the app knows from the start, with the right group and unit.
// Searching suggests these, so you rarely need to create your own items. Adding more only needs a push.

export type CatalogItem = {
  name: string
  group: 'fridge' | 'pantry' | 'staple'
  unit: Unit | null
  // Other names people search for (also catches spelling variants)
  aliases: string[]
  // Shown on the "Kom igång" page
  common: boolean
}

// [name, unit, common, ...aliases] – common is marked with '*'
type Row = [string, Unit, ('*' | '')?, ...string[]]

function rows(group: 'fridge' | 'pantry', list: Row[]): CatalogItem[] {
  return list.map(([name, unit, common, ...aliases]) => ({ name, group, unit, aliases, common: common === '*' }))
}

function spices(list: (string | [string, ...string[]])[]): CatalogItem[] {
  return list.map((entry) => {
    const [name, ...aliases] = Array.isArray(entry) ? entry : [entry]
    return { name, group: 'staple', unit: null, aliases, common: false }
  })
}

const FRIDGE: Row[] = [
  // Dairy and eggs
  ['Mjölk', 'l', '*', 'Mellanmjölk', 'Standardmjölk', 'Lättmjölk'],
  ['Filmjölk', 'l', '*', 'Fil'],
  ['Yoghurt', 'g', '*', 'Naturell yoghurt', 'Grekisk yoghurt', 'Turkisk yoghurt'],
  ['Vispgrädde', 'dl', '*', 'Grädde'],
  ['Matlagningsgrädde', 'dl', '', 'Lätt matlagningsgrädde'],
  ['Crème fraiche', 'dl', '*', 'Creme fraiche', 'Kremfresh'],
  ['Gräddfil', 'dl', ''],
  ['Kvarg', 'g', ''],
  ['Keso', 'g', '', 'Kesella', 'Cottage cheese'],
  ['Ägg', 'pcs', '*'],
  ['Hårdost', 'g', '*', 'Ost', 'Herrgårdsost', 'Grevé', 'Prästost', 'Västerbottensost'],
  ['Riven ost', 'g', '*', 'Gratängost', 'Pizzaost'],
  ['Parmesan', 'g', '', 'Parmesanost', 'Parmigiano'],
  ['Mozzarella', 'g', ''],
  ['Fetaost', 'g', '', 'Feta', 'Salladsost'],
  ['Halloumi', 'g', ''],
  ['Färskost', 'g', '', 'Philadelphia', 'Cream cheese'],
  ['Mascarpone', 'g', ''],
  ['Havredryck', 'l', '', 'Havremjölk', 'Oatly'],
  // Meat, chicken and fish
  ['Köttfärs', 'g', '*', 'Nötfärs', 'Färs'],
  ['Blandfärs', 'g', ''],
  ['Fläskfärs', 'g', ''],
  ['Kycklingfärs', 'g', ''],
  ['Kycklingfilé', 'g', '*', 'Kycklingbröst', 'Kyckling'],
  ['Kycklinglårfilé', 'g', '', 'Kycklinglår'],
  ['Hel kyckling', 'pcs', ''],
  ['Bacon', 'g', '*'],
  ['Falukorv', 'g', '', 'Korv'],
  ['Prinskorv', 'g', ''],
  ['Grillkorv', 'g', '', 'Varmkorv', 'Chorizo'],
  ['Skinka', 'g', '', 'Kokt skinka', 'Rökt skinka', 'Pålägg'],
  ['Fläskfilé', 'g', ''],
  ['Fläskytterfilé', 'pcs', ''],
  ['Fläskkotletter', 'pcs', '', 'Kotlett', 'Fläskkotlett'],
  ['Sidfläsk', 'g', '', 'Rimmat sidfläsk'],
  ['Grytbitar', 'g', '', 'Nötkött', 'Högrev'],
  ['Entrecôte', 'g', '', 'Entrecote', 'Biff', 'Ryggbiff'],
  ['Lammfärs', 'g', ''],
  ['Laxfilé', 'g', '*', 'Lax'],
  ['Torskfilé', 'g', '', 'Torsk', 'Vit fisk'],
  ['Räkor', 'g', '', 'Skalade räkor'],
  ['Fiskpinnar', 'g', ''],
  ['Kycklingpålägg', 'g', ''],
  // Frozen
  ['Frysta ärter', 'g', '', 'Gröna ärter', 'Ärtor'],
  ['Frysta grönsaker', 'g', '', 'Wokgrönsaker', 'Grönsaksblandning'],
  ['Fryst spenat', 'g', '', 'Fryst spinat', 'Bladspenat'],
  ['Frysta bär', 'g', '', 'Blåbär', 'Hallon', 'Jordgubbar'],
  ['Pommes frites', 'g', '', 'Pommes'],
  ['Glass', 'l', ''],
  // Vegetables, fruit and herbs (kept cold)
  ['Tomater', 'g', '*', 'Tomat', 'Kvisttomater', 'Körsbärstomater', 'Cocktailtomater'],
  ['Gurka', 'pcs', '*'],
  ['Paprika', 'pcs', '*', 'Röd paprika', 'Gul paprika', 'Grön paprika'],
  ['Sallad', 'pcs', '*', 'Isbergssallad', 'Romansallad', 'Huvudsallad'],
  ['Babyspenat', 'g', '', 'Spenat'],
  ['Ruccola', 'g', '', 'Rucola', 'Rugola'],
  ['Morötter', 'g', '*', 'Morot'],
  ['Broccoli', 'g', '*'],
  ['Blomkål', 'pcs', ''],
  ['Zucchini', 'pcs', '', 'Squash'],
  ['Aubergine', 'pcs', ''],
  ['Champinjoner', 'g', '*', 'Svamp', 'Champinjon'],
  ['Purjolök', 'pcs', ''],
  ['Salladslök', 'pcs', '', 'Vårlök'],
  ['Selleri', 'pcs', '', 'Blekselleri', 'Stjälkselleri'],
  ['Sockerärtor', 'g', ''],
  ['Haricots verts', 'g', '', 'Brytbönor', 'Gröna bönor'],
  ['Majskolv', 'pcs', ''],
  ['Citron', 'pcs', '*'],
  ['Lime', 'pcs', ''],
  ['Ingefära', 'g', '', 'Färsk ingefära'],
  ['Färsk chili', 'pcs', '', 'Chili', 'Röd chili'],
  ['Persilja', 'pcs', '', 'Färsk persilja', 'Bladpersilja'],
  ['Dill', 'pcs', '', 'Färsk dill'],
  ['Färsk basilika', 'pcs', ''],
  ['Koriander', 'pcs', '', 'Färsk koriander'],
  ['Gräslök', 'pcs', ''],
  ['Lingonsylt', 'dl', '', 'Lingon'],
  ['Druvor', 'g', ''],
  ['Jordgubbar', 'g', ''],
  ['Blåbär', 'g', ''],
  ['Pesto', 'g', '', 'Grön pesto', 'Röd pesto'],
  ['Hummus', 'g', ''],
  ['Tortellini', 'g', '', 'Färsk pasta'],
]

const PANTRY: Row[] = [
  // Vegetables and fruit at room temperature
  ['Potatis', 'g', '*', 'Fast potatis', 'Mjölig potatis', 'Färskpotatis'],
  ['Sötpotatis', 'g', ''],
  ['Gul lök', 'pcs', '*', 'Lök', 'Gullök'],
  ['Rödlök', 'pcs', '*'],
  ['Schalottenlök', 'pcs', '', 'Schalotten'],
  ['Vitlök', 'pcs', '*', 'Vitlöksklyfta', 'Vitlöksklyftor'],
  ['Avokado', 'pcs', ''],
  ['Bananer', 'pcs', '*', 'Banan'],
  ['Äpplen', 'pcs', '*', 'Äpple'],
  ['Apelsiner', 'pcs', '', 'Apelsin'],
  ['Päron', 'pcs', ''],
  ['Mango', 'pcs', ''],
  // Pasta, rice and grains
  ['Pasta', 'g', '*', 'Penne', 'Fusilli', 'Farfalle', 'Pastaskruvar'],
  ['Spagetti', 'g', '*', 'Spaghetti'],
  ['Makaroner', 'g', '', 'Snabbmakaroner'],
  ['Lasagneplattor', 'g', '', 'Lasagne'],
  ['Ris', 'g', '*', 'Jasminris', 'Basmatiris', 'Långkornigt ris'],
  ['Risottoris', 'g', '', 'Arborio'],
  ['Bulgur', 'g', ''],
  ['Couscous', 'g', ''],
  ['Quinoa', 'g', ''],
  ['Matvete', 'g', ''],
  ['Nudlar', 'g', '', 'Äggnudlar', 'Risnudlar', 'Snabbnudlar'],
  ['Gnocchi', 'g', ''],
  ['Havregryn', 'g', '*', 'Havre'],
  ['Müsli', 'g', '', 'Granola'],
  ['Cornflakes', 'g', '', 'Flingor'],
  // Bread
  ['Bröd', 'pcs', '*', 'Limpa', 'Formbröd', 'Rostbröd'],
  ['Knäckebröd', 'g', '', 'Knäcke'],
  ['Tortillabröd', 'pcs', '', 'Tortilla', 'Wraps'],
  ['Hamburgerbröd', 'pcs', ''],
  ['Baguette', 'pcs', ''],
  ['Pitabröd', 'pcs', ''],
  ['Ströbröd', 'g', '', 'Panko'],
  // Cans and jars
  ['Krossade tomater', 'g', '*', 'Krossade tomater på burk', 'Tomater på burk'],
  ['Passerade tomater', 'g', '', 'Passata'],
  ['Tomatpuré', 'ml', '*', 'Tomatpure', 'Tomatpasta'],
  ['Kokosmjölk', 'ml', '*', 'Kokosgrädde'],
  ['Kidneybönor', 'g', '', 'Röda bönor'],
  ['Vita bönor', 'g', '', 'Bönor'],
  ['Svarta bönor', 'g', ''],
  ['Kikärtor', 'g', '', 'Kikärter'],
  ['Röda linser', 'g', '', 'Linser'],
  ['Majs', 'g', '', 'Majs på burk'],
  ['Tonfisk', 'pcs', '', 'Tonfisk på burk'],
  ['Oliver', 'g', ''],
  ['Vattenkastanjer', 'dl', ''],
  ['Soltorkade tomater', 'g', ''],
  ['Inlagd gurka', 'g', '', 'Saltgurka', 'Smörgåsgurka'],
  // Sauces and condiments
  ['Soja', 'ml', '*', 'Sojasås', 'Japansk soja', 'Kinesisk soja'],
  ['Ketchup', 'ml', '*'],
  ['Senap', 'ml', '*', 'Skånsk senap'],
  ['Dijonsenap', 'ml', ''],
  ['Majonnäs', 'ml', '', 'Majonäs', 'Majo'],
  ['Sweet chilisås', 'ml', '', 'Sweet chili'],
  ['Sambal oelek', 'ml', '', 'Sambal'],
  ['Sriracha', 'ml', ''],
  ['Fisksås', 'ml', ''],
  ['Ostronsås', 'ml', ''],
  ['Tacosås', 'ml', ''],
  ['Röd currypasta', 'g', '', 'Currypasta', 'Grön currypasta'],
  ['Kycklingfond', 'ml', '', 'Hönsfond'],
  ['Kalvfond', 'ml', '', 'Oxfond'],
  ['Grönsaksfond', 'ml', ''],
  ['Balsamvinäger', 'ml', '', 'Balsamico'],
  ['Sesamolja', 'ml', ''],
  ['Honung', 'ml', ''],
  ['Sirap', 'ml', '', 'Ljus sirap', 'Mörk sirap'],
  ['Sylt', 'g', '', 'Jordgubbssylt', 'Hallonsylt'],
  ['Jordnötssmör', 'g', ''],
  ['Nötter', 'g', '', 'Cashewnötter', 'Mandlar', 'Valnötter', 'Jordnötter'],
  // Baking and breakfast
  ['Jäst', 'pcs', '', 'Torrjäst'],
  ['Kakao', 'g', '', 'Kakaopulver', 'O’boy'],
  ['Choklad', 'g', '', 'Mörk choklad', 'Mjölkchoklad'],
  ['Kaffe', 'g', '*'],
  ['Te', 'pcs', '', 'Tepåsar'],
  ['Russin', 'g', ''],
]

// Spices and baking basics are staples: always assumed to be at home, never subtracted
const STAPLES = spices([
  ['Salt', 'Flingsalt', 'Havssalt'],
  ['Svartpeppar', 'Peppar'],
  'Vitpeppar',
  ['Olivolja', 'Olja'],
  ['Rapsolja', 'Olja', 'Matolja'],
  'Smör',
  ['Strösocker', 'Socker'],
  ['Vetemjöl', 'Mjöl'],
  ['Vinäger', 'Ättika', 'Ättiksprit'],
  ['Buljong', 'Buljongtärning', 'Hönsbuljong', 'Köttbuljong', 'Grönsaksbuljong'],
  'Paprikapulver',
  ['Rökt paprikapulver', 'Rökt paprika'],
  'Spiskummin',
  'Oregano',
  ['Basilika', 'Torkad basilika'],
  'Timjan',
  'Rosmarin',
  'Mejram',
  'Dragon',
  ['Chiliflakes', 'Chiliflingor'],
  'Chilipulver',
  'Cayennepeppar',
  'Curry',
  'Gurkmeja',
  'Garam masala',
  'Kanel',
  'Kardemumma',
  'Muskot',
  'Kryddnejlika',
  ['Ingefära, malen', 'Malen ingefära'],
  'Vitlökspulver',
  'Lökpulver',
  'Citronpeppar',
  'Grillkrydda',
  'Tacokrydda',
  'Lagerblad',
  'Sesamfrön',
  'Bakpulver',
  'Bikarbonat',
  'Vaniljsocker',
  'Florsocker',
  'Farinsocker',
  ['Majsstärkelse', 'Maizena'],
  'Potatismjöl',
])

export const CATALOG: CatalogItem[] = [...rows('fridge', FRIDGE), ...rows('pantry', PANTRY), ...STAPLES]

// How much one tap on + or − changes the amount. Most items use the default for their unit;
// these are bought or used in smaller (or bigger) portions.
const DEFAULT_STEPS: Record<Unit, number> = { g: 100, ml: 50, dl: 0.5, l: 0.5, pcs: 1 }

const STEP_OVERRIDES: Record<string, number> = {
  Ingefära: 10,
  Parmesan: 50,
  Mozzarella: 125,
  Bacon: 70,
  Babyspenat: 50,
  Ruccola: 50,
  Pesto: 50,
  'Röd currypasta': 25,
  Tomatpuré: 10,
  'Sambal oelek': 10,
  Sriracha: 10,
  Fisksås: 25,
  Ostronsås: 25,
  Sesamolja: 25,
  Dijonsenap: 25,
  Oliver: 50,
  Nötter: 50,
  Choklad: 50,
  Kakao: 50,
  'Soltorkade tomater': 50,
}

export function stepFor(catalogName: string | undefined, unit: Unit | null) {
  return (catalogName && STEP_OVERRIDES[catalogName]) || (unit ? DEFAULT_STEPS[unit] : 1)
}
