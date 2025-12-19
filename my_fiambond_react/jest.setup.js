/* eslint-env node */
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// 1. Polyfill TextEncoder/TextDecoder for React Router & Firebase
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 2. Mock standard process.env variables
process.env.VITE_API_URL = 'http://localhost:3000/api';
process.env.VITE_CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.VITE_CLOUDINARY_UPLOAD_PRESET = 'test-preset';