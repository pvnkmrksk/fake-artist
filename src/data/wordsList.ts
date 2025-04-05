
// List of possible secret words for the game
export const wordsList = [
  "Cat", "Dog", "House", "Car", "Tree",
  "Sun", "Moon", "Star", "Beach", "Mountain",
  "River", "Pizza", "Cake", "Chair", "Table",
  "Phone", "Computer", "Book", "Flower", "Bird",
  "Fish", "Robot", "Ghost", "Alien", "Rocket",
  "Rainbow", "Cloud", "Lightning", "Fire", "Water",
  "Clock", "Guitar", "Bicycle", "Train", "Airplane",
  "Castle", "Dragon", "Unicorn", "Wizard", "Pirate",
  "Dinosaur", "Monkey", "Lion", "Tiger", "Elephant"
];

// Get a random word from the list
export const getRandomWord = (): string => {
  const randomIndex = Math.floor(Math.random() * wordsList.length);
  return wordsList[randomIndex];
};
