
// List of possible secret words for the game
export const wordsList = [
  // Original words
  "Cat", "Dog", "House", "Car", "Tree",
  "Sun", "Moon", "Star", "Beach", "Mountain",
  "River", "Pizza", "Cake", "Chair", "Table",
  "Phone", "Computer", "Book", "Flower", "Bird",
  "Fish", "Robot", "Ghost", "Alien", "Rocket",
  "Rainbow", "Cloud", "Lightning", "Fire", "Water",
  "Clock", "Guitar", "Bicycle", "Train", "Airplane",
  "Castle", "Dragon", "Unicorn", "Wizard", "Pirate",
  "Dinosaur", "Monkey", "Lion", "Tiger", "Elephant",
  
  // Additional words
  "Peacock", "Mango", "Cricket", "Taj Mahal", "Yoga",
  "Tiger", "Elephant", "Curry", "Rickshaw", "Bollywood",
  "Temple", "Sari", "Spice", "Lotus", "Cobra",
  "River Ganges", "Banyan Tree", "Chai", "Sitar", "Rangoli",
  "Diwali", "Holi", "Bangle", "Monsoon", "Scorpion",
  "Camel", "Coconut", "Saree", "Jasmine", "Mango Lassi",
  "Kingfisher", "Frog", "Butterfly", "Tortoise", "Deer",
  "Octopus", "Giraffe", "Penguin", "Elephant", "Kangaroo",
  "Seahorse", "Koala", "Flamingo", "Hedgehog", "Panda",
  "Dolphin", "Owl", "Polar Bear", "Narwhal", "Sloth",
  "Waterfall", "Volcano", "Igloo", "Island", "Desert",
  "Jungle", "Iceberg", "Cave", "Canyon", "Oasis",
  "Pyramid", "Lighthouse", "Windmill", "Bridge", "Tower",
  "Spaceship", "Submarine", "Hot Air Balloon", "Skateboard", "Canoe",
  "Football", "Tennis", "Basketball", "Chess", "Karate",
  "Helmet", "Crown", "Mask", "Backpack", "Umbrella",
  "Camera", "Paintbrush", "Telescope", "Microphone", "Compass",
  "Binoculars", "Magnifying Glass", "Hourglass", "Lantern", "Treasure Chest",
  "Anchor", "Key", "Feather", "Bubble", "Kite",
  "Donut", "Ice Cream", "Popcorn", "Lollipop", "Pancake",
  "Samosa", "Dosa", "Naan", "Biryani", "Gulab Jamun",
  "Tandoor", "Chapati", "Jalebi", "Paneer", "Chutney",
  "Coffee", "Yoga Mat", "Bindi", "Bamboo", "Incense",
  "Tabla", "Dhol", "Veena", "Conch Shell", "Flute"
];

// Add a list of Indian-inspired names for player placeholders
export const indianNames = [
  "Arjun", "Priya", "Rahul", "Neha", "Vikram",
  "Meera", "Ravi", "Anjali", "Deepak", "Shreya",
  "Kiran", "Pooja", "Anil", "Suman", "Vijay",
  "Anita", "Rajesh", "Kavita", "Amit", "Divya",
  "Sanjay", "Geeta", "Manoj", "Sunita", "Ashok",
  "Lata", "Rajiv", "Asha", "Rakesh", "Nisha",
  "Sunil", "Shobha", "Arun", "Rekha", "Mohan",
  "Radha", "Prakash", "Jaya", "Sushil", "Meena"
];

// Get a random word from the list
export const getRandomWord = (): string => {
  const randomIndex = Math.floor(Math.random() * wordsList.length);
  return wordsList[randomIndex];
};

// Get a random name from the list
export const getRandomName = (): string => {
  const randomIndex = Math.floor(Math.random() * indianNames.length);
  return indianNames[randomIndex];
};
