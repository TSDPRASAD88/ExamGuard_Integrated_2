import React from "react";
import useProctoring from "../hooks/useProctoring";

const ExamPage = () => {
  const token = localStorage.getItem("token");
  const sessionId = localStorage.getItem("sessionId");

  useProctoring(sessionId, token);

  return (
    <div>
      <h1>Exam in Progress</h1>
      <p>Do not switch tabs 😐</p>
    </div>
  );
};

export default ExamPage;