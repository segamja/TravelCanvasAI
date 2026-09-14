export interface StoryChapter {
  id: string;
  title: string;
  photoIds: string[];
  body: string;
}

export interface TravelStory {
  projectId: string;
  title: string;
  subtitle?: string;
  chapters: StoryChapter[];
  theme?: string;
}
