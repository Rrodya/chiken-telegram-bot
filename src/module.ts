export function getRandomLength(): number {
  const increase = Math.random() < 0.5;

  // Random amount to change by, between -10 and -1 or between 1 and 25
  const change = increase
    ? Math.floor(Math.random() * 25) + 1
    : -1 * (Math.floor(Math.random() * 10) + 1);

  // Apply the change, but keep the counter within the bounds of -10 and 20
   
  return change;
}
