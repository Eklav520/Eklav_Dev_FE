import PageMetaData from "@/components/PageMetaData"
import { Card } from "react-bootstrap"
import AdminTaskCreation from "./components/CreateTaskForm"




const StudentAdminDetails = () => {
  return (
    <>
      <PageMetaData title="Institute Details" />
      <Card className="bg-transparent border rounded-4">
        <AdminTaskCreation />
      </Card>
    </>
  )
}

export default StudentAdminDetails
