import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { puedeVerRuta } from '../services/permisos';

/**
 * Si el rol no tiene permiso para la ruta (por ejemplo, un vendedor que
 * escribe /usuarios a mano), lo devuelve al dashboard.
 * Se usa como canActivate y canActivateChild.
 */
export const permisoGuard = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  if (puedeVerRuta(state.url)) {
    return true;
  }

  inject(NotificationService).error('No tienes permiso para entrar a esa sección.');
  return inject(Router).createUrlTree(['/dashboard']);
};
