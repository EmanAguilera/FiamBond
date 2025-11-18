import { useContext, useEffect, ChangeEvent, FormEvent, useRef} from "react";
import { AppContext } from "../../Context/AppContext";
import { db } from "../../config/firebase-config";

const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


//dzcnbrgjy