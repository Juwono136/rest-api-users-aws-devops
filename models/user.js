import mongoose from "mongoose";

let profile_imgs_name_list = [
  "Garfield",
  "Tinkerbell",
  "Annie",
  "Loki",
  "Cleo",
  "Angel",
  "Bob",
  "Mia",
  "Coco",
  "Gracie",
  "Bear",
  "Bella",
  "Abby",
  "Harley",
  "Cali",
  "Leo",
  "Luna",
  "Jack",
  "Felix",
  "Kiki",
];
let profile_imgs_collections_list = ["notionists-neutral", "adventurer-neutral", "fun-emoji"];

const userSchema = mongoose.Schema(
  {
    personal_info: {
      binusian_id: {
        type: String,
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
      },
      password: {
        type: String,
        required: true,
      },
      program: {
        type: String,
        default: "",
        index: true,
      },
      address: {
        type: String,
        default: "",
      },
      phone: {
        type: String,
        default: "",
      },
      bio: {
        type: String,
        maxlength: 250,
        default: "",
      },
      role: {
        type: [Number],
        required: true,
        default: [0],
        index: true,
      },
      avatar: {
        type: String,
        default: () => {
          return `https://api.dicebear.com/6.x/${
            profile_imgs_collections_list[
              Math.floor(Math.random() * profile_imgs_collections_list.length)
            ]
          }/svg?seed=${
            profile_imgs_name_list[Math.floor(Math.random() * profile_imgs_name_list.length)]
          }`;
        },
      },
      status: {
        type: String,
        default: "active", // [active, inactive]
        index: true,
      },
    },
    social_links: {
      youtube: {
        type: String,
        default: "",
      },
      instagram: {
        type: String,
        default: "",
      },
      facebook: {
        type: String,
        default: "",
      },
      twitter: {
        type: String,
        default: "",
      },
      github: {
        type: String,
        default: "",
      },
      website: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: {
      createdAt: "joinedAt",
    },
  }
);

userSchema.index({ "personal_info.name": 1, "personal_info.email": 1 });

export default mongoose.model("Users", userSchema);
