export const fruits = [
  {
    name: "apple",
    singular: "apple",
    plural: "apples",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947993648-red-apple.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947994667-black-apple.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "a",
    color: "red",
  },
  {
    name: "banana",
    singular: "banana",
    plural: "bananas",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947988112-yellow-banana-4.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947988911-yellow-banana-ripe-5.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "b",
    color: "yellow",
  },
  {
    name: "cherry",
    singular: "cherry",
    plural: "cherries",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/2909/2909761.png",
    firstLetter: "c",
    color: "red",
  },
  {
    name: "grapes",
    singular: "grape",
    plural: "grapes",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947990827-green-grapes.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947991820-red-grapes-1.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947989827-red-grapes.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947992809-black-grapes-bowl.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947990214-black-grape.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947989420-black-grapes.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "g",
    color: "purple",
  },
  {
    name: "orange",
    singular: "orange",
    plural: "oranges",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947995562-orange-orange.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947996312-cirle-ripe-orange.jpg",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "o",
    color: "orange",
  },
  {
    name: "pear",
    singular: "pear",
    plural: "pears",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947997202-pear.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947998667-pear-fruit.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "p",
    color: "green",
  },
  {
    name: "strawberry",
    singular: "strawberry",
    plural: "strawberries",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947999375-red-strawberry.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948000150-red-strawberries.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948000943-two-strawberries.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948003232-four-fresh-strawberries.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948003845-five-strawberries.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948004913-six-berries-strawberries.jpg",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "s",
    color: "red",
  },
];

export const animals = [
  {
    name: "bear",
    singular: "bear",
    plural: "bears",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpz42pEIpglOy7Rs4NepcIqiBn_OsizWzOiA&s",
    firstLetter: "b",
    color: "brown",
  },
  {
    name: "cat",
    singular: "cat",
    plural: "cats",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/8277/8277431.png",
    firstLetter: "c",
    color: "orange",
  },
  {
    name: "dog",
    singular: "dog",
    plural: "dogs",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1998/1998627.png",
    firstLetter: "d",
    color: "brown",
  },
  {
    name: "elephant",
    singular: "elephant",
    plural: "elephants",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXGJwl3ha8CW0PDtSrSWAHZxEZQgjvZhLBRg&s",
    firstLetter: "e",
    color: "grey",
  },
  {
    name: "frog",
    singular: "frog",
    plural: "frogs",
    imageUrl: "https://png.pngtree.com/png-clipart/20230917/original/pngtree-cartoon-frog-icon-in-a-flat-style-design-vector-png-image_12279492.png",
    firstLetter: "f",
    color: "green",
  },
  {
    name: "giraffe",
    singular: "giraffe",
    plural: "giraffes",
    imageUrl: "https://png.pngtree.com/png-clipart/20240817/original/pngtree-cartoon-animal-giraffe-png-image_15796001.png",
    firstLetter: "g",
    color: "yellow",
  },
  {
    name: "lion",
    singular: "lion",
    plural: "lions",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/3065/3065729.png",
    firstLetter: "l",
    color: "yellow",
  },
  {
    name: "monkey",
    singular: "monkey",
    plural: "monkeys",
    get imageUrl() {
      const urls = [
        "https://cdn-icons-png.flaticon.com/128/8418/8418337.png",
        "https://cdn-icons-png.flaticon.com/128/3195/3195966.png",
        "https://cdn-icons-png.flaticon.com/128/11879/11879988.png",
        "https://cdn-icons-png.flaticon.com/128/1660/1660696.png",
        "https://cdn-icons-png.flaticon.com/128/6236/6236379.png",
        "https://cdn-icons-png.flaticon.com/128/3819/3819238.png"
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "m",
    color: "brown",
  },
  {
    name: "rabbit",
    singular: "rabbit",
    plural: "rabbits",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939507948-1807972.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939505926-10365936.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939504799-7271678.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939503732-6364346.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939502649-2663084.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939501333-10197512.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939500900-8145918.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939500294-16935098.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939499279-1692271.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939498264-7272406.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939496880-8153082.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939496403-1303575.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "r",
    color: "white",
  },


  {
    name: "whale",
    singular: "whale",
    plural: "whales",
get imageUrl() {
      const urls = [
"https://cdn-icons-png.flaticon.com/128/6575/6575924.png",
"https://cdn-icons-png.flaticon.com/128/11879/11879926.png",
"https://cdn-icons-png.flaticon.com/128/1806/1806197.png",
"https://cdn-icons-png.flaticon.com/128/7584/7584068.png",
"https://cdn-icons-png.flaticon.com/128/1864/1864475.png",
"https://cdn-icons-png.flaticon.com/128/9071/9071049.png",
"https://cdn-icons-png.flaticon.com/128/7432/7432659.png"

      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "w",
    color: "blue",
  },
];

export const things = [
  {
    name: "ball",
    singular: "ball",
    plural: "balls",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/sports/1779960193587-ball3.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/sports/1779960192992-ball4.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/sports/1779960188741-ball2.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/sports/1779960182564-ball1.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "b",
    // color: "red",
  },
  {
    name: "book",
    singular: "book",
    plural: "books",
    get imageUrl() {
      const urls = [
        "https://cdn-icons-png.flaticon.com/128/9809/9809619.png",
        "https://cdn-icons-png.flaticon.com/128/2702/2702154.png",
        "https://cdn-icons-png.flaticon.com/128/2702/2702184.png",
        "https://cdn-icons-png.flaticon.com/128/3038/3038168.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "b",
    color: "blue",
  },
  {
    name: "chair",
    singular: "chair",
    plural: "chairs",
    get imageUrl() {
      const urls = [
        "https://cdn-icons-png.flaticon.com/128/1378/1378353.png",
        "https://cdn-icons-png.flaticon.com/128/1683/1683707.png",
        "https://cdn-icons-png.flaticon.com/128/2559/2559499.png",
        "https://cdn-icons-png.flaticon.com/128/3157/3157429.png",
        "https://cdn-icons-png.flaticon.com/128/9565/9565366.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "c",
    color: "brown",
  },
  {
    name: "clock",
    singular: "clock",
    plural: "clocks",
    get imageUrl() {
      const urls = [
        "https://cdn-icons-png.flaticon.com/128/4285/4285622.png",
        "https://cdn-icons-png.flaticon.com/128/1584/1584858.png",
        "https://cdn-icons-png.flaticon.com/128/1407/1407089.png",
        "https://cdn-icons-png.flaticon.com/128/2102/2102627.png",
        "https://cdn-icons-png.flaticon.com/128/2964/2964519.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "c",
    color: "blue",
  },
  {
    name: "hat",
    singular: "hat",
    plural: "hats",
    get imageUrl() {
      const urls = [
"https://cdn-icons-png.flaticon.com/128/1785/1785366.png",
"https://cdn-icons-png.flaticon.com/128/4645/4645229.png",
"https://cdn-icons-png.flaticon.com/128/4336/4336786.png",
"https://cdn-icons-png.flaticon.com/128/7652/7652220.png",
"https://cdn-icons-png.flaticon.com/128/7577/7577347.png",
"https://cdn-icons-png.flaticon.com/128/4507/4507269.png"

      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "h",
    color: "red",
  },
  {
    name: "umbrella",
    singular: "umbrella",
    plural: "umbrellas",
    get imageUrl() {
      const urls = [
        "https://cdn-icons-png.flaticon.com/128/949/949816.png",
        "https://cdn-icons-png.flaticon.com/128/4258/4258916.png",
        "https://cdn-icons-png.flaticon.com/128/2357/2357375.png",
        "https://cdn-icons-png.flaticon.com/128/2664/2664593.png",
        "https://cdn-icons-png.flaticon.com/128/2122/2122704.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "u",
    color: "blue",
  },
  {
    name: "pencil",
    singular: "pencil",
    plural: "pencils",
    get imageUrl() {
      const urls = [
        "https://cdn-icons-png.flaticon.com/128/2280/2280532.png",
        "https://cdn-icons-png.flaticon.com/128/3790/3790171.png",
        "https://cdn-icons-png.flaticon.com/128/7927/7927175.png",
        "https://cdn-icons-png.flaticon.com/128/7402/7402020.png",
        "https://cdn-icons-png.flaticon.com/128/1302/1302104.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "p",
    color: "yellow",
  },
];

export const vehicles = [
  {
    name: "airplane",
    singular: "airplane",
    plural: "airplanes",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779959438614-aeroplane4.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779959433311-aeroplane3.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779959429544-aeroplane2.png",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779959425174-aeroplane1.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "a",
    color: "blue",
  },
  {
    name: "boat",
    singular: "boat",
    plural: "boats",
    get imageUrl() {
      const urls = [
        "https://cdn-icons-png.flaticon.com/512/995/995260.png",
        "https://cdn-icons-png.flaticon.com/128/2910/2910793.png",
        "https://cdn-icons-png.flaticon.com/128/3130/3130310.png",
        "https://cdn-icons-png.flaticon.com/128/4181/4181181.png"
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "b",
    color: "blue",
  },
  {
    name: "car",
    singular: "car",
    plural: "cars",
    get imageUrl() {
      const urls = [
        "https://cdn-icons-png.flaticon.com/128/2555/2555013.png",
        "https://cdn-icons-png.flaticon.com/128/2554/2554896.png",
        "https://cdn-icons-png.flaticon.com/128/2168/2168422.png",
        "https://cdn-icons-png.flaticon.com/128/2061/2061956.png",
        "https://cdn-icons-png.flaticon.com/128/14023/14023095.png",
        "https://cdn-icons-png.flaticon.com/128/12988/12988417.png",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "c",
    color: "red",
  },
  {
    name: "train",
    singular: "train",
    plural: "trains",
    get imageUrl() {
      const urls = [
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/vehicles/1779949973038-high-speed-train-concept-illustration_114360-17150.avif",
        "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779952394013-train-of-the-red-colour-on-white-background-vector-3740318.webp",
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    },
    firstLetter: "t",
    color: "yellow",
  },
];
