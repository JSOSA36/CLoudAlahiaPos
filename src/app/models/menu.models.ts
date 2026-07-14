export interface MenuItemView {
  codigo: string;
  title: string;
  url: string;
  icon: string;
  iconFa: any;
}

export interface MenuGrupoView {
  id: string;
  titulo: string;
  icono: string;
  iconFa: any;
  expandido: boolean;
  items: MenuItemView[];
}

export interface MenuSalirView {
  title: string;
  url: string;
  icon: string;
  iconFa: any;
}
