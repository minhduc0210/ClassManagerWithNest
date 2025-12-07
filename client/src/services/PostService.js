import { api } from "./AuthService";

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const fetchCreatePost = async (classroomID, slotID, inputs) => {
  const result = await api.post(`${BASE_URL}/posts/${classroomID}/${slotID}`, inputs);
  return result;
};

export const fetchPostsByClassroom = async (classroomID) => {
  const result = await api.get(`${BASE_URL}/posts/${classroomID}`);
  return result;
};

export const fetchPostsBySlot = async (classroomID, slotID) => {
  const result = await api.get(`${BASE_URL}/posts/${classroomID}/${slotID}`);
  return result;
};

export const fetchDownloadPostFile = (filename) => {
  const filePath = `${BASE_URL}/posts/download/${filename}`;
  return filePath;
};

export const fetchDeletePost = async (slotID, postID) => {
  const result = await api.delete(`${BASE_URL}/posts/${slotID}/${postID}`);
  return result
};

export const fetchUpdatePost = async (classroomID, slotID, postID, inputs) => {
  const result = await api.patch(`${BASE_URL}/posts/${classroomID}/${slotID}/${postID}`, inputs);
  return result;
};