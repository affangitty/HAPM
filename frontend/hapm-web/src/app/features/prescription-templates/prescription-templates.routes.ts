import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const PRESCRIPTION_TEMPLATE_ROUTES: Routes = [
  {
    path: 'templates',
    loadComponent: () =>
      import('./pages/template-list-page.component').then((m) => m.TemplateListPageComponent),
    data: { title: 'Prescription Templates' },
  },
  {
    path: 'templates/create',
    loadComponent: () =>
      import('./pages/template-create-page.component').then((m) => m.TemplateCreatePageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Create Template' },
  },
  {
    path: 'templates/:id/edit',
    loadComponent: () =>
      import('./pages/template-edit-page.component').then((m) => m.TemplateEditPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Edit Template' },
  },
  {
    path: 'templates/:id',
    loadComponent: () =>
      import('./pages/template-detail-page.component').then((m) => m.TemplateDetailPageComponent),
    data: { title: 'Template Details' },
  },
];
