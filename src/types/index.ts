/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Resource {
  id: string;
  name: string;
  unit: string;
  type: 'Labor' | 'Material' | 'Equipment';
  cost: number;
}

export interface Composition {
  id: string;
  name: string;
  unit: string;
  resources: {
    resourceId: string;
    quantity: number;
  }[];
  totalCost: number;
}

export interface EAPItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  compositionId?: string;
  unitValue: number;
  totalValue: number;
  children?: EAPItem[];
}

export interface Budget {
  id: string;
  name: string;
  sre: string;
  municipality: string;
  school: string;
  schoolAddress: string;
  date: string;
  status: 'Draft' | 'Approved' | 'Closed';
  eap: EAPItem[];
  totalValue: number;
}
