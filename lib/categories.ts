// Full 3-level taxonomy — Fiction/Nonfiction/Poetry/Drama/Comics/etc.
// Level 1 = category, Level 2 = genre, Level 3 = theme (leaf).
// Used in admin dashboard forms and mobile app search/filters.

export interface Genre {
  name: string;
  themes: string[];
}

export interface Category {
  name: string;
  emoji: string;
  genres: Genre[];
}

export const CATEGORY_TREE: Category[] = [
  {
    name: "Fiction",
    emoji: "📖",
    genres: [
      { name: "Action & Adventure", themes: ["Adventure", "Action", "Survival", "Military Adventure", "Treasure Hunt", "Swashbuckler", "Disaster", "Espionage", "Quest", "Rescue Mission", "Wilderness Adventure", "Sea Adventure"] },
      { name: "Romance", themes: ["Contemporary Romance", "Historical Romance", "Medieval Romance", "Western Romance", "Romantic Comedy", "Mafia Romance", "Billionaire Romance", "Small Town Romance", "Sports Romance", "Second Chance Romance", "Friends to Lovers", "Enemies to Lovers", "Marriage of Convenience", "Fantasy Romance", "Time Travel Romance", "Christian Romance", "Clean Romance", "Young Adult Romance"] },
      { name: "Mystery", themes: ["Cozy Mystery", "Amateur Sleuth", "Police Procedural", "Detective Fiction", "Hard-Boiled", "Historical Mystery", "Legal Mystery", "Medical Mystery", "Culinary Mystery", "Paranormal Mystery", "Private Investigator", "Crime Mystery"] },
      { name: "Thriller", themes: ["Political Thriller", "Spy Thriller", "Techno-Thriller", "Military Thriller", "Medical Thriller", "Legal Thriller", "Conspiracy Thriller", "Eco-Thriller", "Religious Thriller", "Supernatural Thriller"] },
      { name: "Horror", themes: ["Cosmic Horror", "Folk Horror", "Haunted House", "Vampire", "Zombie", "Werewolf", "Demon", "Monster Horror", "Survival Horror", "Apocalyptic Horror"] },
      { name: "Science Fiction", themes: ["Hard Science Fiction", "Space Opera", "Military Science Fiction", "Cyberpunk", "Steampunk", "Dieselpunk", "Solarpunk", "Biopunk", "Nanopunk", "Time Travel", "Utopian", "First Contact", "Alien Invasion", "Space Exploration", "Post-Apocalyptic", "Artificial Intelligence", "Robot Fiction", "Genetic Engineering", "Parallel Universes"] },
      { name: "Fantasy", themes: ["Epic Fantasy", "Low Fantasy", "Sword & Sorcery", "Dark Fantasy", "Historical Fantasy", "Fairy Tale Retelling", "Mythic Fantasy", "Arthurian Fantasy", "Heroic Fantasy", "Magical Realism", "Fairy Fantasy", "Dragon Fantasy", "Monster Fantasy"] },
      { name: "Historical Fiction", themes: ["Ancient History", "Medieval", "Renaissance", "Victorian", "Regency", "World War", "Tartarian", "Colonial", "Biblical", "Historical Adventure", "Historical Romance", "Historical Mystery"] },
      { name: "Literary Fiction", themes: ["Family Saga", "Campus Novel", "Social Commentary"] },
      { name: "Crime", themes: ["Organized Crime", "Mafia", "Prison Fiction", "Gang Fiction"] },
      { name: "Western", themes: ["Classic Western", "Modern Western", "Frontier", "Outlaw", "Cowboy Fiction"] },
      { name: "Drama", themes: ["Family Drama", "Courtroom Drama", "Political Drama"] },
      { name: "Humor", themes: ["Satire", "Parody", "Farce", "Comic Fantasy"] },
      { name: "Young Adult", themes: ["YA Fantasy", "YA Romance", "YA Mystery", "YA Science Fiction", "YA Contemporary"] },
      { name: "Middle Grade", themes: ["MG Fantasy", "MG Adventure", "MG Mystery", "MG Historical", "MG Science Fiction"] },
      { name: "Children's Fiction", themes: ["Picture Books", "Early Readers", "Chapter Books", "Bedtime Stories", "Fairy Tales", "Fables", "Animal Stories", "Educational Stories"] },
      { name: "Christian Fiction", themes: ["Biblical Fiction", "Inspirational Fiction", "Amish Fiction", "Christian Romance", "Christian Suspense"] },
      { name: "Religious Fiction", themes: ["Islamic Fiction", "Jewish Fiction", "Hindu Fiction", "Buddhist Fiction", "Scientology Fiction"] },
    ],
  },
  {
    name: "Nonfiction",
    emoji: "📘",
    genres: [
      { name: "Biography & Memoir", themes: ["Biography", "Autobiography", "Family Memoir", "Celebrity Memoir", "Political Memoir", "Military Memoir", "Sports Memoir", "Travel Memoir"] },
      { name: "History", themes: ["Ancient History", "Medieval History", "Modern History", "Military History", "World History", "American History", "European History", "African History", "Asian History", "Indigenous History"] },
      { name: "Business", themes: ["Entrepreneurship", "Leadership", "Management", "Marketing", "Sales", "Investing", "Finance", "Economics", "Startups", "Real Estate", "Small Business"] },
      { name: "Self-Help", themes: ["Motivation", "Productivity", "Habits", "Success", "Confidence", "Time Management", "Goal Setting", "Happiness", "Minimalism", "Organization"] },
      { name: "Health & Fitness", themes: ["Nutrition", "Diet", "Exercise", "Working Out", "Weight Loss", "Wellness", "Holistic Health", "Eastern Medicine", "Biology and Health"] },
      { name: "Cooking", themes: ["Cookbooks", "Baking", "Grilling", "Fasting", "Farming", "Keto", "Paleo", "Mediterranean", "Desserts", "International Cuisine"] },
      { name: "Science", themes: ["Astronomy", "Biology", "Chemistry", "Physics", "Geology", "Ecology", "Genetics", "Neuroscience", "Mathematics"] },
      { name: "Technology", themes: ["Artificial Intelligence", "Programming", "Cybersecurity", "Robotics", "Computer Science", "Data Science", "Networking"] },
      { name: "Religion & Spirituality", themes: ["Christianity", "Judaism", "Islam", "Hinduism", "Buddhism", "Paganism", "New Age", "Spiritual Growth", "Theology"] },
      { name: "Education", themes: ["Teaching", "Homeschooling", "Curriculum", "Special Education", "Educational Psychology"] },
      { name: "Law", themes: ["Criminal Law", "Civil Law", "Constitutional Law", "Family Law", "Business Law", "International Law"] },
      { name: "Politics", themes: ["Political Science", "Public Policy", "Government", "International Relations", "Diplomacy"] },
      { name: "Nature", themes: ["Wildlife", "Birds", "Marine Life", "Plants", "Conservation", "Outdoor Survival"] },
      { name: "Travel", themes: ["Travel Guides", "Adventure Travel", "Backpacking", "Cruise Travel", "Budget Travel"] },
      { name: "Crafts & Hobbies", themes: ["Knitting", "Crochet", "Sewing", "Quilting", "Woodworking", "Metalworking", "Pottery", "Painting", "Drawing", "Photography"] },
      { name: "Home", themes: ["Interior Design", "Gardening", "Homesteading", "Tiny Homes", "Organization", "DIY"] },
      { name: "Parenting", themes: ["Pregnancy", "Living with Children", "Adoption", "Homeschooling", "Parenting"] },
      { name: "Sports", themes: ["Baseball", "Football", "Soccer", "Basketball", "Golf", "Martial Arts", "Hunting", "Fishing"] },
      { name: "Reference", themes: ["Dictionary", "Encyclopedia", "Atlas", "Almanac", "Handbook", "Manual", "Guidebook"] },
    ],
  },
  {
    name: "Poetry",
    emoji: "🖋️",
    genres: [
      { name: "Poetry", themes: ["Lyric Poetry", "Narrative Poetry", "Epic Poetry", "Free Verse", "Sonnet", "Haiku", "Limerick", "Ballad", "Spoken Word", "Slam Poetry"] },
    ],
  },
  {
    name: "Drama",
    emoji: "🎭",
    genres: [
      { name: "Drama", themes: ["Tragedy", "Comedy", "Tragicomedy", "Musical", "One-Act Play", "Screenplay", "Stage Play", "Radio Play"] },
    ],
  },
  {
    name: "Comics & Graphic Works",
    emoji: "💥",
    genres: [
      { name: "Comics & Graphic Works", themes: ["Graphic Novel", "Manga", "Comic Book", "Webtoon", "Manhwa", "Manhua"] },
    ],
  },
  {
    name: "Educational",
    emoji: "🎓",
    genres: [
      { name: "Educational", themes: ["Textbooks", "Workbooks", "Study Guides", "Test Preparation", "Activity Books"] },
    ],
  },
  {
    name: "Reference & Professional",
    emoji: "🧭",
    genres: [
      { name: "Reference & Professional", themes: ["Medical", "Engineering", "Architecture", "Agriculture", "Aviation", "Maritime", "Veterinary", "Nursing", "Dentistry", "Legal", "Accounting"] },
    ],
  },
  {
    name: "Special Formats",
    emoji: "🗂️",
    genres: [
      { name: "Special Formats", themes: ["Journals", "Diaries", "Coloring Books", "Puzzle Books", "Activity Books", "Coffee Table Books", "Pop-Up Books", "Interactive Books", "Audiobooks", "Large Print", "Braille", "Flip Books"] },
    ],
  },
];

export function categoryNames(): string[] {
  return CATEGORY_TREE.map((c) => c.name);
}

export function genresFor(categoryName: string): Genre[] {
  return CATEGORY_TREE.find((c) => c.name === categoryName)?.genres ?? [];
}

export function themesFor(categoryName: string, genreName: string): string[] {
  return genresFor(categoryName).find((g) => g.name === genreName)?.themes ?? [];
}

export function categoryEmoji(name: string): string {
  return CATEGORY_TREE.find((c) => c.name === name)?.emoji ?? "📚";
}
