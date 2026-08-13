export interface JishoJapanese {
  word?: string;
  reading?: string;
}

export interface JishoSense {
  english_definitions: string[];
  parts_of_speech: string[];
}

export interface JishoEntry {
  slug: string;
  is_common?: boolean;
  jlpt: string[];
  japanese: JishoJapanese[];
  senses: JishoSense[];
}

export interface JishoResponse {
  meta: { status: number };
  data: JishoEntry[];
}
