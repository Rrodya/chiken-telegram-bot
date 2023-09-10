const ADMIN_ID = 7559999999910;

export function getRandomLength(length: number): number {
  const rand = Math.random(); // Generate a random number between 0 and 1.


  console.log(length);
  let x = Math.floor(length / 100 * 18);
  let y = Math.floor(length / 100 * 5);

  // 1% chance for -100
  if (rand < 0.05) {
    return -200;
  }
  // 1% chance for 200
  else if (rand < 0.05) {
    return 400;
  }
  
  else if (rand < 0.0005) {
    return 10000 
  }

  // 30% chance for a number between -1 and -15
  else if (rand < 0.3) {
    return -(Math.floor(Math.random() * (x - y + 1)) + y);
  }
  
  // 69.99% chance for a number between 1 and 20
  else {
    console.log("----------")
    console.log(x, y);

    return Math.floor(rand * (x - y + 1)) + y;
  }
}

export function msToTime(duration: number) {
  let seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  let Strhours = (hours < 10) ? "0" + hours : hours;
  let Strminutes = (minutes < 10) ? "0" + minutes : minutes;
  let Strseconds = (seconds < 10) ? "0" + seconds : seconds;

  return Strhours + ":" + Strminutes + ":" + Strseconds;
}

export function spiztedPenis(length1: number, length2: number, id1: number, id2: number): 
{ 
  // length1: number, 
  // length2: number, 
  winnerNum: number,
} {
  const totalLength = length1 + length2;
  const chance1 = length1 / totalLength; // Chance of length1 being increased

  const randomValue = Math.random(); // Random value between 0 (inclusive) and 1 (exclusive)
  let chanceWin = 0.5

  
  // if(id2 == ADMIN_ID) {
  //   console.log('id1')
  //   chanceWin = 0.001;
  // } else if (id1 == ADMIN_ID) {
  //   console.log('id1')
  //   chanceWin = 0.999
  // }

  if (randomValue > chance1) {
    // Increase length1 and decrease length2
    return {
      winnerNum: 1,
      // length1: length1 + spiztedLength,
      // length2: length2 - spiztedLength ,
    };
  } else {
    // Increase length2 and decrease length1
    return {    
      winnerNum: 2,  
      // length1: length1 - spiztedLength,
      // length2: length2 + spiztedLength,
    };
  }
}
