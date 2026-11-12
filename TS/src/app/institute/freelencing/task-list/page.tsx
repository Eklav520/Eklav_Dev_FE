import PageMetaData from "@/components/PageMetaData";
import TaskListManager from "../components/TaskListManager";

const FreelancingTaskListPage = () => {
  return (
    <>
      <PageMetaData title="Internship Tasks" />
      {/* No extra card — the layout's content card is the only frame, as on the other admin pages */}
      <TaskListManager />
    </>
  );
};

export default FreelancingTaskListPage;
