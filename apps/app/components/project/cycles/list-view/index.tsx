// react
import React from "react";
// swr
import useSWR from "swr";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
// components
import SingleListIssue from "components/common/list-view/single-issue";
// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { CustomMenu, Spinner } from "ui";
// icons
import { PlusIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
// types
import { IIssue, IWorkspaceMember, NestedKeyOf, Properties } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
// common
import { addSpaceIfCamelCase } from "constants/common";

type Props = {
  groupedByIssues: {
    [key: string]: (IIssue & { bridge?: string })[];
  };
  properties: Properties;
  selectedGroup: NestedKeyOf<IIssue> | null;
  openCreateIssueModal: (issue?: IIssue, actionType?: "create" | "edit" | "delete") => void;
  openIssuesListModal: () => void;
  removeIssueFromCycle: (bridgeId: string) => void;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPreloadedData: React.Dispatch<
    React.SetStateAction<
      | (Partial<IIssue> & {
          actionType: "createIssue" | "edit" | "delete";
        })
      | undefined
    >
  >;
};

const CyclesListView: React.FC<Props> = ({
  groupedByIssues,
  selectedGroup,
  openCreateIssueModal,
  openIssuesListModal,
  properties,
  removeIssueFromCycle,
  handleDeleteIssue,
  setPreloadedData,
}) => {
  const { activeWorkspace, states } = useUser();

  const { data: people } = useSWR<IWorkspaceMember[]>(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  return (
    <div className="flex flex-col space-y-5">
      {Object.keys(groupedByIssues).map((singleGroup) => {
        const stateId =
          selectedGroup === "state_detail.name"
            ? states?.find((s) => s.name === singleGroup)?.id ?? null
            : null;

        return (
          <Disclosure key={singleGroup} as="div" defaultOpen>
            {({ open }) => (
              <div className="bg-white rounded-lg">
                <div className="bg-gray-100 px-4 py-3 rounded-t-lg">
                  <Disclosure.Button>
                    <div className="flex items-center gap-x-2">
                      <span>
                        <ChevronDownIcon
                          className={`h-4 w-4 text-gray-500 ${!open ? "transform -rotate-90" : ""}`}
                        />
                      </span>
                      {selectedGroup !== null ? (
                        <h2 className="font-medium leading-5 capitalize">
                          {singleGroup === null || singleGroup === "null"
                            ? selectedGroup === "priority" && "No priority"
                            : addSpaceIfCamelCase(singleGroup)}
                        </h2>
                      ) : (
                        <h2 className="font-medium leading-5">All Issues</h2>
                      )}
                      <p className="text-gray-500 text-sm">
                        {groupedByIssues[singleGroup as keyof IIssue].length}
                      </p>
                    </div>
                  </Disclosure.Button>
                </div>
                <Transition
                  show={open}
                  enter="transition duration-100 ease-out"
                  enterFrom="transform opacity-0"
                  enterTo="transform opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform opacity-100"
                  leaveTo="transform opacity-0"
                >
                  <Disclosure.Panel>
                    <div className="divide-y-2">
                      {groupedByIssues[singleGroup] ? (
                        groupedByIssues[singleGroup].length > 0 ? (
                          groupedByIssues[singleGroup].map((issue) => {
                            const assignees = [
                              ...(issue?.assignees_list ?? []),
                              ...(issue?.assignees ?? []),
                            ]?.map((assignee) => {
                              const tempPerson = people?.find(
                                (p) => p.member.id === assignee
                              )?.member;

                              return {
                                avatar: tempPerson?.avatar,
                                first_name: tempPerson?.first_name,
                                email: tempPerson?.email,
                              };
                            });

                            return (
                              <SingleListIssue
                                key={issue.id}
                                type="cycle"
                                issue={issue}
                                properties={properties}
                                editIssue={() => openCreateIssueModal(issue, "edit")}
                                handleDeleteIssue={() => handleDeleteIssue(issue.id)}
                                removeIssue={() => removeIssueFromCycle(issue.bridge ?? "")}
                              />
                            );
                          })
                        ) : (
                          <p className="text-sm px-4 py-3 text-gray-500">No issues.</p>
                        )
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Spinner />
                        </div>
                      )}
                    </div>
                  </Disclosure.Panel>
                </Transition>
                <div className="p-3">
                  <CustomMenu
                    label={
                      <span className="flex items-center gap-1">
                        <PlusIcon className="h-3 w-3" />
                        Add issue
                      </span>
                    }
                    optionsPosition="left"
                    withoutBorder
                  >
                    <CustomMenu.MenuItem
                      onClick={() => {
                        openCreateIssueModal();
                        if (selectedGroup !== null) {
                          setPreloadedData({
                            state: stateId !== null ? stateId : undefined,
                            [selectedGroup]: singleGroup,
                            actionType: "createIssue",
                          });
                        }
                      }}
                    >
                      Create new
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem onClick={() => openIssuesListModal()}>
                      Add an existing issue
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
            )}
          </Disclosure>
        );
      })}
    </div>
  );
};

export default CyclesListView;
