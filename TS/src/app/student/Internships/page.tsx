import React from "react";
import PageMetaData from "@/components/PageMetaData";
import InternshipDetailsPage from "./components/InternshipList/InternshipDetailsPage";



const InternshipPage = () => {
  return (
    <>
      <PageMetaData title="Available Internships" />
      <InternshipDetailsPage/>
    </>
  );
};

export default InternshipPage;