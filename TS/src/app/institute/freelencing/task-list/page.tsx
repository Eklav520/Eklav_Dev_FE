import PageMetaData from "@/components/PageMetaData";
import { Card } from "react-bootstrap";
import TaskListManager from "../components/TaskListManager";

const FreelancingTaskListPage = () => {
  return (
    <>
      <PageMetaData title="Freelancing Tasks" />
      <Card className="bg-transparent border rounded-4">
        <TaskListManager />
      </Card>
    </>
  );
};

export default FreelancingTaskListPage;
