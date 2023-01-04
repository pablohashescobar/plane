// react
import { useState } from "react";
// next
import Image from "next/image";
// swr
import useSWR from "swr";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// layouts
import SettingsLayout from "layouts/settings-layout";
// components
import ConfirmWorkspaceMemberRemove from "components/workspace/ConfirmWorkspaceMemberRemove";
import SendWorkspaceInvitationModal from "components/workspace/SendWorkspaceInvitationModal";
// ui
import { BreadcrumbItem, Breadcrumbs, Button, CustomListbox, CustomMenu, Loader } from "ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// fetch-keys
import { WORKSPACE_INVITATIONS, WORKSPACE_MEMBERS } from "constants/fetch-keys";

const ROLE = {
  5: "Guest",
  10: "Viewer",
  15: "Member",
  20: "Admin",
};

const MembersSettings = () => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState(false);

  const { activeWorkspace } = useUser();

  const { setToastAlert } = useToast();

  const { data: workspaceMembers, mutate: mutateMembers } = useSWR<any[]>(
    activeWorkspace ? WORKSPACE_MEMBERS(activeWorkspace.slug) : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );
  const { data: workspaceInvitations, mutate: mutateInvitations } = useSWR<any[]>(
    activeWorkspace ? WORKSPACE_INVITATIONS : null,
    activeWorkspace ? () => workspaceService.workspaceInvitations(activeWorkspace.slug) : null
  );

  const members = [
    ...(workspaceMembers?.map((item) => ({
      id: item.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      last_name: item.member?.last_name,
      email: item.member?.email,
      role: item.role,
      status: true,
      member: true,
    })) || []),
    ...(workspaceInvitations?.map((item) => ({
      id: item.id,
      avatar: item.avatar ?? "",
      first_name: item.first_name ?? item.email,
      last_name: item.last_name ?? "",
      email: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
    })) || []),
  ];

  return (
    <>
      <ConfirmWorkspaceMemberRemove
        isOpen={Boolean(selectedRemoveMember) || Boolean(selectedInviteRemoveMember)}
        onClose={() => {
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
        data={
          selectedRemoveMember
            ? members.find((item) => item.id === selectedRemoveMember)
            : selectedInviteRemoveMember
            ? members.find((item) => item.id === selectedInviteRemoveMember)
            : null
        }
        handleDelete={async () => {
          if (!activeWorkspace) return;
          if (selectedRemoveMember) {
            await workspaceService.deleteWorkspaceMember(
              activeWorkspace.slug,
              selectedRemoveMember
            );
            mutateMembers(
              (prevData) => prevData?.filter((item) => item.id !== selectedRemoveMember),
              false
            );
          }
          if (selectedInviteRemoveMember) {
            await workspaceService.deleteWorkspaceInvitations(
              activeWorkspace.slug,
              selectedInviteRemoveMember
            );
            mutateInvitations(
              (prevData) => prevData?.filter((item) => item.id !== selectedInviteRemoveMember),
              false
            );
          }
          setToastAlert({
            type: "success",
            title: "Success",
            message: "Member removed successfully",
          });
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
      />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        setIsOpen={setInviteModal}
        workspace_slug={activeWorkspace?.slug as string}
        members={members}
      />
      <SettingsLayout
        type="workspace"
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"}`} link={`/workspace`} />
            <BreadcrumbItem title="Members Settings" />
          </Breadcrumbs>
        }
      >
        <section className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">Members</h3>
            <p className="mt-4 text-sm text-gray-500">Manage all the members of the workspace.</p>
          </div>
          {!workspaceMembers || !workspaceInvitations ? (
            <Loader className="space-y-5 md:w-2/3">
              <Loader.Item height="40px"></Loader.Item>
              <Loader.Item height="40px"></Loader.Item>
              <Loader.Item height="40px"></Loader.Item>
              <Loader.Item height="40px"></Loader.Item>
            </Loader>
          ) : (
            <div className="md:w-2/3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-md mb-1 leading-6 text-gray-900">Manage members</h4>
                <Button
                  theme="secondary"
                  className="flex items-center gap-x-1"
                  onClick={() => setInviteModal(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Member
                </Button>
              </div>
              <div className="mt-6 space-y-6">
                {members.length > 0
                  ? members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-x-8 gap-y-2">
                          <div className="relative flex h-10 w-10 items-center justify-center rounded bg-gray-700 p-4 capitalize text-white">
                            {member.avatar && member.avatar !== "" ? (
                              <Image
                                src={member.avatar}
                                alt={member.first_name}
                                layout="fill"
                                objectFit="cover"
                                className="rounded"
                              />
                            ) : member.first_name !== "" ? (
                              member.first_name.charAt(0)
                            ) : (
                              member.email.charAt(0)
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm">
                              {member.first_name} {member.last_name}
                            </h4>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {selectedMember === member.id ? (
                            <CustomListbox
                              options={Object.keys(ROLE).map((key) => ({
                                display: ROLE[parseInt(key) as keyof typeof ROLE],
                                value: key,
                              }))}
                              title={ROLE[member.role as keyof typeof ROLE] ?? "None"}
                              value={member.role}
                              onChange={(value) => {
                                workspaceService
                                  .updateWorkspaceMember(
                                    activeWorkspace?.slug as string,
                                    member.id,
                                    {
                                      role: value,
                                    }
                                  )
                                  .then(() => {
                                    mutateMembers(
                                      (prevData) =>
                                        prevData?.map((m) => {
                                          return m.id === selectedMember
                                            ? { ...m, role: value }
                                            : m;
                                        }),
                                      false
                                    );
                                    setToastAlert({
                                      title: "Success",
                                      type: "success",
                                      message: "Member role updated successfully.",
                                    });
                                    setSelectedMember(null);
                                  })
                                  .catch(() => {
                                    setToastAlert({
                                      title: "Error",
                                      type: "error",
                                      message: "An error occurred while updating member role.",
                                    });
                                  });
                              }}
                            />
                          ) : (
                            ROLE[member.role as keyof typeof ROLE] ?? "None"
                          )}
                          <CustomMenu ellipsis>
                            <CustomMenu.MenuItem
                              onClick={() => {
                                if (!member.member) {
                                  setToastAlert({
                                    type: "error",
                                    message: "You can't edit a pending invitation.",
                                    title: "Error",
                                  });
                                } else {
                                  setSelectedMember(member.id);
                                }
                              }}
                            >
                              Edit
                            </CustomMenu.MenuItem>
                            <CustomMenu.MenuItem
                              onClick={() => {
                                if (member.member) {
                                  setSelectedRemoveMember(member.id);
                                } else {
                                  setSelectedInviteRemoveMember(member.id);
                                }
                              }}
                            >
                              Remove
                            </CustomMenu.MenuItem>
                          </CustomMenu>
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            </div>
          )}
        </section>
      </SettingsLayout>
    </>
  );
};

export default MembersSettings;