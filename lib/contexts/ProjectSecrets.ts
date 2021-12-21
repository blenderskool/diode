import { Secret } from '@prisma/client';
import { createContext } from 'react';

const ProjectSecrets = createContext<Pick<Secret, 'name'>[]>([]);

export default ProjectSecrets;
