export const fruits = [
  { 
    name: 'apple', 
    singular: 'apple', 
    plural: 'apples', 
    get imageUrl() {
      const urls = [
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947993648-red-apple.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947994667-black-apple.png'
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }, 
    firstLetter: 'a', 
    color: 'red' 
  },
  { 
    name: 'banana', 
    singular: 'banana', 
    plural: 'bananas', 
    get imageUrl() {
      const urls = [
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947988112-yellow-banana-4.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947988911-yellow-banana-ripe-5.png'
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }, 
    firstLetter: 'b', 
    color: 'yellow' 
  },
  { 
    name: 'cherry', 
    singular: 'cherry', 
    plural: 'cherries', 
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2909/2909761.png', 
    firstLetter: 'c', 
    color: 'red' 
  },
  { 
    name: 'grapes', 
    singular: 'grape', 
    plural: 'grapes', 
    get imageUrl() {
      const urls = [
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947990827-green-grapes.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947991820-red-grapes-1.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947989827-red-grapes.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947992809-black-grapes-bowl.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947990214-black-grape.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947989420-black-grapes.png'
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }, 
    firstLetter: 'g', 
    color: 'purple' 
  },
  { 
    name: 'orange', 
    singular: 'orange', 
    plural: 'oranges', 
    get imageUrl() {
      const urls = [
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947995562-orange-orange.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947996312-cirle-ripe-orange.jpg'
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }, 
    firstLetter: 'o', 
    color: 'orange' 
  },
  { 
    name: 'pear', 
    singular: 'pear', 
    plural: 'pears', 
    get imageUrl() {
      const urls = [
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947997202-pear.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947998667-pear-fruit.png'
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }, 
    firstLetter: 'p', 
    color: 'green' 
  },
  { 
    name: 'strawberry', 
    singular: 'strawberry', 
    plural: 'strawberries', 
    get imageUrl() {
      const urls = [
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779947999375-red-strawberry.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948000150-red-strawberries.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948000943-two-strawberries.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948003232-four-fresh-strawberries.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948003845-five-strawberries.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/fruits/1779948004913-six-berries-strawberries.jpg'
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }, 
    firstLetter: 's', 
    color: 'red' 
  }
];

export const animals = [
  { name: 'bear', singular: 'bear', plural: 'bears', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2908/2908620.png', firstLetter: 'b', color: 'brown' },
  { name: 'cat', singular: 'cat', plural: 'cats', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1998/1998592.png', firstLetter: 'c', color: 'orange' },
  { name: 'dog', singular: 'dog', plural: 'dogs', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1998/1998621.png', firstLetter: 'd', color: 'brown' },
  { name: 'elephant', singular: 'elephant', plural: 'elephants', imageUrl: 'https://cdn-icons-png.flaticon.com/512/490/490001.png', firstLetter: 'e', color: 'grey' },
  { name: 'frog', singular: 'frog', plural: 'frogs', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1998/1998813.png', firstLetter: 'f', color: 'green' },
  { name: 'giraffe', singular: 'giraffe', plural: 'giraffes', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1998/1998634.png', firstLetter: 'g', color: 'yellow' },
  { name: 'lion', singular: 'lion', plural: 'lions', imageUrl: 'https://cdn-icons-png.flaticon.com/512/490/490125.png', firstLetter: 'l', color: 'yellow' },
  { name: 'monkey', singular: 'monkey', plural: 'monkeys', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1998/1998713.png', firstLetter: 'm', color: 'brown' },
  { 
    name: 'rabbit', 
    singular: 'rabbit', 
    plural: 'rabbits', 
    get imageUrl() {
      const urls = [
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939507948-1807972.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939505926-10365936.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939504799-7271678.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939503732-6364346.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939502649-2663084.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939501333-10197512.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939500900-8145918.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939500294-16935098.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939499279-1692271.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939498264-7272406.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939496880-8153082.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939496403-1303575.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939495118-10739880.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939494160-7441430.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939493126-2687162.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939491697-802389.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939490817-15814463.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939489440-8145678.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939487467-523442.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939486953-12107938.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939486368-8677462.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939485938-2219683.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939485401-10366101.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939484966-347401.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939483808-6363517.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939482639-14423531.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/questions/1779939482135-12518882.png'
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }, 
    firstLetter: 'r', 
    color: 'white' 
  },
  { name: 'whale', singular: 'whale', plural: 'whales', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1998/1998810.png', firstLetter: 'w', color: 'blue' }
];

export const things = [
  { name: 'ball', singular: 'ball', plural: 'balls', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3246/3246666.png', firstLetter: 'b', color: 'red' },
  { name: 'book', singular: 'book', plural: 'books', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2904/2904832.png', firstLetter: 'b', color: 'blue' },
  { name: 'chair', singular: 'chair', plural: 'chairs', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2590/2590494.png', firstLetter: 'c', color: 'brown' },
  { name: 'clock', singular: 'clock', plural: 'clocks', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2997/2997973.png', firstLetter: 'c', color: 'blue' },
  { name: 'hat', singular: 'hat', plural: 'hats', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995400.png', firstLetter: 'h', color: 'red' },
  { name: 'umbrella', singular: 'umbrella', plural: 'umbrellas', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3067/3067645.png', firstLetter: 'u', color: 'blue' },
  { name: 'pencil', singular: 'pencil', plural: 'pencils', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2919/2919572.png', firstLetter: 'p', color: 'yellow' }
];

export const vehicles = [
  { 
    name: 'airplane', 
    singular: 'airplane', 
    plural: 'airplanes', 
    get imageUrl() {
      const urls = [
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779959438614-aeroplane4.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779959433311-aeroplane3.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779959429544-aeroplane2.png',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779959425174-aeroplane1.png'
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }, 
    firstLetter: 'a', 
    color: 'blue' 
  },
  { name: 'boat', singular: 'boat', plural: 'boats', imageUrl: 'https://cdn-icons-png.flaticon.com/512/995/995260.png', firstLetter: 'b', color: 'blue' },
  { name: 'car', singular: 'car', plural: 'cars', imageUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png', firstLetter: 'c', color: 'red' },
  { 
    name: 'train', 
    singular: 'train', 
    plural: 'trains', 
    get imageUrl() {
      const urls = [
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/vehicles/1779949973038-high-speed-train-concept-illustration_114360-17150.avif',
        'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1779952394013-train-of-the-red-colour-on-white-background-vector-3740318.webp'
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }, 
    firstLetter: 't', 
    color: 'yellow' 
  }
];
