import PageMetaData from "@/components/PageMetaData"
import AdminTaskCreation from "./components/CreateTaskForm"

const StudentAdminDetails = () => {
  return (
    <>
      <PageMetaData title="Create Internship Task" />
      {/* No extra card — the layout's content card is the only frame, as on the other admin pages */}
      <AdminTaskCreation />
    </>
  )
}

export default StudentAdminDetails
