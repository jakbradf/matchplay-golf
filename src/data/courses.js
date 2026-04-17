export const STROMSTAD_GK = {
  id: 'stromstad-gk',
  name: 'Strömstads Golfklubb',
  location: 'Strömstad, Sweden',
  par: 71,
  holes: [
    { number: 1,  par: 4, strokeIndex: 9,  distance: 316, isParThree: false },
    { number: 2,  par: 4, strokeIndex: 13, distance: 275, isParThree: false },
    { number: 3,  par: 5, strokeIndex: 5,  distance: 450, isParThree: false },
    { number: 4,  par: 3, strokeIndex: 15, distance: 120, isParThree: true  },
    { number: 5,  par: 4, strokeIndex: 3,  distance: 397, isParThree: false },
    { number: 6,  par: 3, strokeIndex: 11, distance: 137, isParThree: true  },
    { number: 7,  par: 4, strokeIndex: 1,  distance: 352, isParThree: false },
    { number: 8,  par: 4, strokeIndex: 17, distance: 246, isParThree: false },
    { number: 9,  par: 5, strokeIndex: 7,  distance: 460, isParThree: false },
    { number: 10, par: 3, strokeIndex: 12, distance: 157, isParThree: true  },
    { number: 11, par: 4, strokeIndex: 6,  distance: 302, isParThree: false },
    { number: 12, par: 3, strokeIndex: 14, distance: 116, isParThree: true  },
    { number: 13, par: 4, strokeIndex: 16, distance: 285, isParThree: false },
    { number: 14, par: 4, strokeIndex: 8,  distance: 287, isParThree: false },
    { number: 15, par: 5, strokeIndex: 10, distance: 454, isParThree: false },
    { number: 16, par: 4, strokeIndex: 4,  distance: 366, isParThree: false },
    { number: 17, par: 5, strokeIndex: 2,  distance: 482, isParThree: false },
    { number: 18, par: 3, strokeIndex: 18, distance: 142, isParThree: true  },
  ]
};

export const DROBAK_GK = {
  id: 'drobak-gk',
  name: 'Drøbak Golfklubb',
  location: 'Drøbak, Norway',
  par: 70,
  holes: [
    { number: 1,  par: 4, strokeIndex: 17, distance: 263, isParThree: false },
    { number: 2,  par: 4, strokeIndex: 5,  distance: 330, isParThree: false },
    { number: 3,  par: 5, strokeIndex: 3,  distance: 411, isParThree: false },
    { number: 4,  par: 3, strokeIndex: 13, distance: 117, isParThree: true  },
    { number: 5,  par: 4, strokeIndex: 7,  distance: 238, isParThree: false },
    { number: 6,  par: 3, strokeIndex: 9,  distance: 158, isParThree: true  },
    { number: 7,  par: 4, strokeIndex: 1,  distance: 314, isParThree: false },
    { number: 8,  par: 5, strokeIndex: 15, distance: 398, isParThree: false },
    { number: 9,  par: 4, strokeIndex: 11, distance: 317, isParThree: false },
    { number: 10, par: 4, strokeIndex: 6,  distance: 290, isParThree: false },
    { number: 11, par: 4, strokeIndex: 18, distance: 258, isParThree: false },
    { number: 12, par: 4, strokeIndex: 10, distance: 221, isParThree: false },
    { number: 13, par: 4, strokeIndex: 2,  distance: 334, isParThree: false },
    { number: 14, par: 4, strokeIndex: 16, distance: 253, isParThree: false },
    { number: 15, par: 3, strokeIndex: 14, distance: 122, isParThree: true  },
    { number: 16, par: 4, strokeIndex: 8,  distance: 264, isParThree: false },
    { number: 17, par: 3, strokeIndex: 12, distance: 102, isParThree: true  },
    { number: 18, par: 4, strokeIndex: 4,  distance: 316, isParThree: false },
  ]
};

export const ALL_COURSES = [STROMSTAD_GK, DROBAK_GK];

export function getCourseById(id) {
  return ALL_COURSES.find(c => c.id === id) || null;
}
