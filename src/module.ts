// export function getRandomLength(): number {
//   const increase = Math.random() < 0.5;

//   // Random amount to change by, between -10 and -1 or between 1 and 25
//   const change = increase
//     ? Math.floor(Math.random() * 25) + 1
//     : -1 * (Math.floor(Math.random() * 10) + 1);

//   // Apply the change, but keep the counter within the bounds of -10 and 20
   
//   return change;
// }

export function getRandomLength(): number {
  const rand = Math.random(); // Generate a random number between 0 and 1.

  // 0.01% chance for -100
  if (rand < 0.0001) {
    return -100;
  }
  // 0.01% chance for 200
  else if (rand < 0.0002) {
    return 200;
  }
  // 30% chance for a number between -1 and -15
  else if (rand < 0.3) {
    return Math.floor(rand * 15) - 15;
  }
  // 69.98% chance for a number between 1 and 20
  else {
    return Math.floor(rand * 20) + 1;
  }
}
