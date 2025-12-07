import { api } from "./AuthService";

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const fetchCreateClassroom = async (inputs) => {
  const result = await api.post(`${BASE_URL}/classrooms/create`, inputs);
  return result;
};

export const fetchJoinClassroom = async (code) => {
  const result = await api.post(
    `${BASE_URL}/classrooms/join/${code}`
  );
  return result;
};

export const fetchClassroomDetail = async (classroomID) => {
  const result = await api.get(`${BASE_URL}/classrooms/${classroomID}`);
  return result;
};

export const fetchUpdateClassroom = async (classroomID, inputs) => {
  const result = await api.put(
    `${BASE_URL}/classrooms/${classroomID}`,
    inputs
  );
  return result;
};

export const fetchDeleteClassroom = async (classroomID) => {
  const result = await api.delete(`${BASE_URL}/classrooms/${classroomID}`);
  return result;
};

export const fetchRemoveStudentFromClass = async (classroomID, studentID) => {
  const result = await api.patch(`${BASE_URL}/classrooms/${classroomID}/${studentID}`);
  return result;
};