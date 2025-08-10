import type { Character } from "../types";

import riftanCard from "../assets/images/img_card_riftan.jpg";
import riftanProfile from "../assets/images/img_profile_riftan.jpg";
import riftanIcon from "../assets/images/img_icon_riftan.jpg";

import heinriCard from "../assets/images/img_card_heinri.jpg";
import heinriProfile from "../assets/images/img_profile_heinri.jpg";
import heinriIcon from "../assets/images/img_icon_heinri.jpg";

import tiwakanCard from "../assets/images/img_card_tiwakan.jpg";
import tiwakanProfile from "../assets/images/img_profile_tiwakan.jpg";
import tiwakanIcon from "../assets/images/img_icon_tiwakan.jpg";

import taegyeomCard from "../assets/images/img_card_taegyeom.jpg";
import taegyeomProfile from "../assets/images/img_profile_taegyeom.jpg";
import taegyeomIcon from "../assets/images/img_icon_taegyeom.jpg";

import dokjaCard from "../assets/images/img_card_dokja.jpg";
import dokjaProfile from "../assets/images/img_profile_dokja.jpg";
import dokjaIcon from "../assets/images/img_icon_dokja.jpg";

export const characters: Character[] = [
  {
    id: "riftan",
    name: "Riftan Calypse",
    novelTitle: "Under the oak tree",
    genre: "Romance Fantasy",
    keywords: ["Adult", "Adventure", "Fantasy", "Josei", "Romance"],
    likes: 382,
    imageCardUrl: riftanCard,
    imageProfileUrl: riftanProfile,
    imageIconUrl: riftanIcon,
  },
  {
    id: "heinri",
    name: "Emperor Heinrey",
    novelTitle: "The Remarried Empress",
    genre: "Romance Fantasy",
    keywords: ["Drama", "Fantasy", "Josei", "Psychological", "Romance"],
    likes: 501,
    imageCardUrl: heinriCard,
    imageProfileUrl: heinriProfile,
    imageIconUrl: heinriIcon,
  },
  {
    id: "tiwakan",
    name: "Lord Tiwakan",
    novelTitle: "A Barbaric Proposal",
    genre: "Romance Fantasy",
    keywords: ["Drama", "Fantasy", "Josei", "Mature", "Romance"],
    likes: 219,
    imageCardUrl: tiwakanCard,
    imageProfileUrl: tiwakanProfile,
    imageIconUrl: tiwakanIcon,
  },
  {
    id: "taegyeom",
    name: "Taegyeom Kwon",
    novelTitle: "Lights Don’t Go Out in the Annex",
    genre: "Mystery Romance",
    keywords: ["Adult", "Drama", "Mystery", "Mature", "Romance"],
    likes: 188,
    imageCardUrl: taegyeomCard,
    imageProfileUrl: taegyeomProfile,
    imageIconUrl: taegyeomIcon,
  },
  {
    id: "dokja",
    name: "Kim Dokja",
    novelTitle: "Omniscient Reader’s Viewpoint",
    genre: "Romance Fantasy",
    keywords: ["Action", "Adventure", "Comedy", "Drama", "Fantasy"],
    likes: 984,
    imageCardUrl: dokjaCard,
    imageProfileUrl: dokjaProfile,
    imageIconUrl: dokjaIcon,
  },
]; 