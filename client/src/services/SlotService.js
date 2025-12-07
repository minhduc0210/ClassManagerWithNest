import { api } from "./AuthService";
const BASE_URL = process.env.REACT_APP_BASE_URL;

export const fetchCreateSlot = async (classroomID, inputs) => {
  const result = await api.post(`${BASE_URL}/slots/${classroomID}`, inputs);
  return result;
};

export const fetchUpdateSlot = async (slotID, inputs) => {
    const result = await api.put(`${BASE_URL}/slots/${slotID}`, inputs);
    return result;
  };

