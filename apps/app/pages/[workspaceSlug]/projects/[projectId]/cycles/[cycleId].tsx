// react
import React, { useState } from "react";
// next
import { useRouter } from "next/router";
// swr
import useSWR, { mutate } from "swr";
// layouots
import AppLayout from "layouts/app-layout";
// components
import CyclesListView from "components/project/cycles/list-view";
import CyclesBoardView from "components/project/cycles/board-view";
import CreateUpdateIssuesModal from "components/project/issues/create-update-issue-modal";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import ExistingIssuesListModal from "components/common/existing-issues-list-modal";
// constants
import { filterIssueOptions, groupByOptions, orderByOptions } from "constants/";
// services
import issuesServices from "lib/services/issues.service";
import cycleServices from "lib/services/cycles.service";
import projectService from "lib/services/project.service";
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
import useIssuesFilter from "lib/hooks/useIssuesFilter";
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { BreadcrumbItem, Breadcrumbs, CustomMenu } from "ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/20/solid";
import { ArrowPathIcon, ChevronDownIcon, ListBulletIcon } from "@heroicons/react/24/outline";
// types
import { CycleIssueResponse, IIssue, Properties, SelectIssue } from "types";
// fetch-keys
import {
  CYCLE_ISSUES,
  CYCLE_LIST,
  PROJECT_ISSUES_LIST,
  PROJECT_MEMBERS,
  WORKSPACE_DETAILS,
  PROJECT_DETAILS,
} from "constants/fetch-keys";
// common
import { classNames, replaceUnderscoreIfSnakeCase } from "constants/common";
import CycleDetailSidebar from "components/project/cycles/cycle-detail-sidebar";

const SingleCycle: React.FC = () => {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<SelectIssue>();
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);

  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const {
    query: { workspaceSlug, projectId, cycleId },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: activeProject } = useSWR(
    activeWorkspace && projectId ? PROJECT_DETAILS(projectId as string) : null,
    activeWorkspace && projectId
      ? () => projectService.getProject(activeWorkspace.slug, projectId as string)
      : null
  );

  const { data: issues } = useSWR(
    activeWorkspace && projectId
      ? PROJECT_ISSUES_LIST(activeWorkspace.slug, projectId as string)
      : null,
    activeWorkspace && projectId
      ? () => issuesServices.getIssues(activeWorkspace.slug, projectId as string)
      : null
  );

  const [properties, setProperties] = useIssuesProperties(
    activeWorkspace?.slug,
    activeProject?.id as string
  );

  const { data: cycles } = useSWR(
    activeWorkspace && activeProject ? CYCLE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => cycleServices.getCycles(activeWorkspace.slug, activeProject.id)
      : null
  );

  const { data: cycleIssues } = useSWR<CycleIssueResponse[]>(
    activeWorkspace && activeProject && cycleId ? CYCLE_ISSUES(cycleId as string) : null,
    activeWorkspace && activeProject && cycleId
      ? () =>
          cycleServices.getCycleIssues(activeWorkspace?.slug, activeProject?.id, cycleId as string)
      : null
  );
  const cycleIssuesArray = cycleIssues?.map((issue) => {
    return { bridge: issue.id, ...issue.issue_detail };
  });

  const { data: members } = useSWR(
    activeWorkspace && activeProject ? PROJECT_MEMBERS(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => projectService.projectMembers(activeWorkspace.slug, activeProject.id)
      : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const partialUpdateIssue = (formData: Partial<IIssue>, issueId: string) => {
    if (!activeWorkspace || !activeProject) return;
    issuesServices
      .patchIssue(activeWorkspace.slug, activeProject.id, issueId, formData)
      .then((response) => {
        mutate(CYCLE_ISSUES(cycleId as string));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const {
    issueView,
    groupByProperty,
    setGroupByProperty,
    groupedByIssues,
    setOrderBy,
    setFilterIssue,
    orderBy,
    filterIssue,
    setIssueViewToKanban,
    setIssueViewToList,
  } = useIssuesFilter(cycleIssuesArray ?? []);

  const openCreateIssueModal = (
    issue?: IIssue,
    actionType: "create" | "edit" | "delete" = "create"
  ) => {
    if (issue) setSelectedIssues({ ...issue, actionType });
    setIsIssueModalOpen(true);
  };

  const openIssuesListModal = () => {
    setCycleIssuesListModal(true);
  };

  const handleAddIssuesToCycle = (data: { issues: string[] }) => {
    if (activeWorkspace && activeProject) {
      issuesServices
        .addIssueToCycle(activeWorkspace.slug, activeProject.id, cycleId as string, data)
        .then((res) => {
          console.log(res);
          mutate(CYCLE_ISSUES(cycleId as string));
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  const removeIssueFromCycle = (bridgeId: string) => {
    if (!activeWorkspace || !activeProject) return;

    mutate<CycleIssueResponse[]>(
      CYCLE_ISSUES(cycleId as string),
      (prevData) => prevData?.filter((p) => p.id !== bridgeId),
      false
    );

    issuesServices
      .removeIssueFromCycle(activeWorkspace.slug, activeProject.id, cycleId as string, bridgeId)
      .then((res) => {
        console.log(res);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <>
      <CreateUpdateIssuesModal
        isOpen={isIssueModalOpen && selectedIssues?.actionType !== "delete"}
        data={selectedIssues}
        prePopulateData={{ sprints: cycleId as string, ...preloadedData }}
        setIsOpen={setIsIssueModalOpen}
        projectId={activeProject?.id}
      />
      <ExistingIssuesListModal
        isOpen={cycleIssuesListModal}
        handleClose={() => setCycleIssuesListModal(false)}
        type="cycle"
        issues={issues?.results ?? []}
        handleOnSubmit={handleAddIssuesToCycle}
      />
      <ConfirmIssueDeletion
        handleClose={() => setDeleteIssue(undefined)}
        isOpen={!!deleteIssue}
        data={issues?.results.find((issue) => issue.id === deleteIssue)}
      />
      <AppLayout
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${activeProject?.name ?? "Project"} Cycles`}
              link={`/${workspaceSlug}/projects/${activeProject?.id}/cycles`}
            />
          </Breadcrumbs>
        }
        left={
          <CustomMenu
            label={
              <>
                <ArrowPathIcon className="h-3 w-3" />
                {cycles?.find((c) => c.id === cycleId)?.name}
              </>
            }
            className="ml-1.5"
            width="auto"
          >
            {cycles?.map((cycle) => (
              <CustomMenu.MenuItem
                key={cycle.id}
                renderAs="a"
                href={`/${workspaceSlug}/projects/${activeProject?.id}/cycles/${cycle.id}`}
              >
                {cycle.name}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        }
        right={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-x-1">
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                  issueView === "list" ? "bg-gray-200" : ""
                }`}
                onClick={() => setIssueViewToList()}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                  issueView === "kanban" ? "bg-gray-200" : ""
                }`}
                onClick={() => setIssueViewToKanban()}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={classNames(
                      open ? "bg-gray-100 text-gray-900" : "text-gray-500",
                      "group flex items-center gap-2 rounded-md border bg-transparent p-2 text-xs font-medium hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
                    )}
                  >
                    <span>View</span>
                    <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                  </Popover.Button>

                  <Transition
                    as={React.Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-20 mt-1 w-screen max-w-xs transform overflow-hidden rounded-lg bg-white p-3 shadow-lg">
                      <div className="relative flex flex-col gap-1 gap-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm text-gray-600">Group by</h4>
                          <CustomMenu
                            label={
                              groupByOptions.find((option) => option.key === groupByProperty)
                                ?.name ?? "Select"
                            }
                            width="auto"
                          >
                            {groupByOptions.map((option) => (
                              <CustomMenu.MenuItem
                                key={option.key}
                                onClick={() => setGroupByProperty(option.key)}
                              >
                                {option.name}
                              </CustomMenu.MenuItem>
                            ))}
                          </CustomMenu>
                        </div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm text-gray-600">Order by</h4>
                          <CustomMenu
                            label={
                              orderByOptions.find((option) => option.key === orderBy)?.name ??
                              "Select"
                            }
                            width="auto"
                          >
                            {orderByOptions.map((option) =>
                              groupByProperty === "priority" && option.key === "priority" ? null : (
                                <CustomMenu.MenuItem
                                  key={option.key}
                                  onClick={() => setOrderBy(option.key)}
                                >
                                  {option.name}
                                </CustomMenu.MenuItem>
                              )
                            )}
                          </CustomMenu>
                        </div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm text-gray-600">Issue type</h4>
                          <CustomMenu
                            label={
                              filterIssueOptions.find((option) => option.key === filterIssue)
                                ?.name ?? "Select"
                            }
                            width="auto"
                          >
                            {filterIssueOptions.map((option) => (
                              <CustomMenu.MenuItem
                                key={option.key}
                                onClick={() => setFilterIssue(option.key)}
                              >
                                {option.name}
                              </CustomMenu.MenuItem>
                            ))}
                          </CustomMenu>
                        </div>
                        <div className="border-b-2"></div>
                        <div className="relative flex flex-col gap-1">
                          <h4 className="text-base text-gray-600">Properties</h4>
                          <div className="flex flex-wrap items-center gap-2">
                            {Object.keys(properties).map((key) => (
                              <button
                                key={key}
                                type="button"
                                className={`rounded border border-theme px-2 py-1 text-xs capitalize ${
                                  properties[key as keyof Properties]
                                    ? "border-theme bg-theme text-white"
                                    : ""
                                }`}
                                onClick={() => setProperties(key as keyof Properties)}
                              >
                                {replaceUnderscoreIfSnakeCase(key)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
        }
        noPadding
      >
        <div className="flex h-full gap-5 pl-5">
          <div className="h-full w-[calc(100vw-24rem)] min-w-0 flex-grow-0 py-5">
            {issueView === "list" ? (
              <CyclesListView
                groupedByIssues={groupedByIssues}
                selectedGroup={groupByProperty}
                properties={properties}
                openCreateIssueModal={openCreateIssueModal}
                openIssuesListModal={openIssuesListModal}
                removeIssueFromCycle={removeIssueFromCycle}
                handleDeleteIssue={setDeleteIssue}
                setPreloadedData={setPreloadedData}
              />
            ) : (
              <CyclesBoardView
                groupedByIssues={groupedByIssues}
                properties={properties}
                removeIssueFromCycle={removeIssueFromCycle}
                selectedGroup={groupByProperty}
                members={members}
                openCreateIssueModal={openCreateIssueModal}
                openIssuesListModal={openIssuesListModal}
                handleDeleteIssue={setDeleteIssue}
                partialUpdateIssue={partialUpdateIssue}
                setPreloadedData={setPreloadedData}
              />
            )}
          </div>
          <div className="w-[24rem] flex-shrink-0">
            <CycleDetailSidebar
              cycle={cycles?.find((c) => c.id === (cycleId as string))}
              cycleIssues={cycleIssues ?? []}
            />
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default SingleCycle;
