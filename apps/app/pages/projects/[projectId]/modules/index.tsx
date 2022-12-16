// next
import type { NextPage } from "next";
import useSWR from "swr";
import { useRouter } from "next/router";
// layouts
import AppLayout from "layouts/app-layout";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
// services
import modulesService from "lib/services/modules.service";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { BreadcrumbItem, Breadcrumbs, EmptySpace, EmptySpaceItem, HeaderButton, Spinner } from "ui";
// icons
import { PlusIcon, RectangleGroupIcon } from "@heroicons/react/24/outline";
// types
import { IModule } from "types/modules";
// fetch-keys
import { MODULE_LIST } from "constants/fetch-keys";

const ProjectModules: NextPage = () => {
  const { activeWorkspace, activeProject } = useUser();

  const router = useRouter();
  const { projectId } = router.query;

  const { data: modules } = useSWR<IModule[]>(
    activeWorkspace && projectId ? MODULE_LIST(projectId as string) : null,
    activeWorkspace && projectId
      ? () => modulesService.getModules(activeWorkspace.slug, projectId as string)
      : null
  );

  console.log(modules);

  return (
    <AppLayout
      meta={{
        title: "Plane - Modules",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link="/projects" />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Modules`} />
        </Breadcrumbs>
      }
      right={
        <HeaderButton
          Icon={PlusIcon}
          label="Add Module"
          onClick={() => {
            const e = new KeyboardEvent("keydown", {
              ctrlKey: true,
              key: "m",
            });
            document.dispatchEvent(e);
          }}
        />
      }
    >
      {modules ? (
        modules.length > 0 ? (
          <div className="space-y-5">
            {modules.map((module) => (
              <div key={module.id} className="bg-white p-3 rounded-md">
                <h3>{module.name}</h3>
                <p className="text-gray-500 text-sm mt-2">{module.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center px-4">
            <EmptySpace
              title="You don't have any module yet."
              description="A cycle is a fixed time period where a team commits to a set number of issues from their backlog. Cycles are usually one, two, or four weeks long."
              Icon={RectangleGroupIcon}
            >
              <EmptySpaceItem
                title="Create a new module"
                description={
                  <span>
                    Use <pre className="inline bg-gray-100 px-2 py-1 rounded">Ctrl/Command + Q</pre>{" "}
                    shortcut to create a new cycle
                  </span>
                }
                Icon={PlusIcon}
                action={() => {
                  return;
                }}
              />
            </EmptySpace>
          </div>
        )
      ) : (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </AppLayout>
  );
};

export default withAuth(ProjectModules);