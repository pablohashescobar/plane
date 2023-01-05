import React, { createContext, ReactElement, useEffect, useState } from "react";
// next
import Router from "next/router";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// services
import userService from "lib/services/user.service";
import projectServices from "lib/services/project.service";
import workspaceService from "lib/services/workspace.service";
// constants
import { CURRENT_USER, PROJECTS_LIST, USER_WORKSPACES } from "constants/fetch-keys";

// types
import type { KeyedMutator } from "swr";
import type { IUser, IWorkspace, IProject } from "types";

interface IUserContextProps {
  user?: IUser;
  isUserLoading: boolean;
  mutateUser: KeyedMutator<IUser>;
  activeWorkspace?: IWorkspace;
  mutateWorkspaces: KeyedMutator<IWorkspace[]>;
  workspaces?: IWorkspace[];
  projects?: IProject[];
  setActiveProject: React.Dispatch<React.SetStateAction<IProject | undefined>>;
  mutateProjects: KeyedMutator<IProject[]>;
  activeProject?: IProject;
  slug?: string;
}

export const UserContext = createContext<IUserContextProps>({} as IUserContextProps);

export const UserProvider = ({ children }: { children: ReactElement }) => {
  const [activeWorkspace, setActiveWorkspace] = useState<IWorkspace | undefined>();
  const [activeProject, setActiveProject] = useState<IProject | undefined>();

  const router = useRouter();

  const { projectId } = router.query;

  // API to fetch user information
  const {
    data: user,
    error,
    mutate,
  } = useSWR<IUser>(CURRENT_USER, () => userService.currentUser(), {
    shouldRetryOnError: false,
  });

  const {
    data: workspaces,
    error: workspaceError,
    mutate: mutateWorkspaces,
  } = useSWR<IWorkspace[]>(
    user ? USER_WORKSPACES : null,
    user ? () => workspaceService.userWorkspaces() : null,
    {
      shouldRetryOnError: false,
    }
  );

  const { data: projects, mutate: mutateProjects } = useSWR<IProject[]>(
    activeWorkspace ? PROJECTS_LIST(activeWorkspace.slug) : null,
    activeWorkspace ? () => projectServices.getProjects(activeWorkspace.slug) : null
  );

  useEffect(() => {
    if (!projects) return;
    const activeProject = projects.find((project) => project.id === projectId);
    setActiveProject(activeProject ?? projects[0]);
  }, [projectId, projects]);

  useEffect(() => {
    if (user?.last_workspace_id) {
      const workspace = workspaces?.find((item) => item.id === user?.last_workspace_id);
      if (workspace) {
        setActiveWorkspace(workspace);
      } else {
        const workspace = workspaces?.[0];
        setActiveWorkspace(workspace);
        userService.updateUser({ last_workspace_id: workspace?.id });
      }
    } else if (user) {
      const workspace = workspaces?.[0];
      setActiveWorkspace(workspace);
      userService.updateUser({ last_workspace_id: workspace?.id });
    }
  }, [user, workspaces]);

  useEffect(() => {
    if (!workspaces) return;
    if (workspaces.length === 0) Router.push("/invitations");
  }, [workspaces]);

  return (
    <UserContext.Provider
      value={{
        user: error ? undefined : user,
        isUserLoading: Boolean(user === undefined && error === undefined),
        mutateUser: mutate,
        activeWorkspace: workspaceError ? undefined : activeWorkspace,
        mutateWorkspaces: mutateWorkspaces,
        workspaces: workspaceError ? undefined : workspaces,
        projects,
        mutateProjects: mutateProjects,
        activeProject,
        setActiveProject,
        slug: error ? undefined : user?.slug,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
