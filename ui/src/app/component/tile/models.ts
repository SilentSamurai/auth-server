import {PermissionService} from '../../_services/permission.service';

/**
 * Optional function type for permission checks on tiles.
 * Returns true if tile should be shown (permitted).
 */
export type TilePermissionCheck = (
    permissionService: PermissionService,
) => boolean;

export interface Models {
    isAllowed(): boolean;
}

const sizeMap = {
    sm: {
        width: '100px',
        height: '100px',
    },
    md: {
        width: '200px',
        height: '200px',
    },
    lg: {
        width: '425px',
        height: '200px',
    },
};

/**
 * Tile model class defines the structure and logic of a dashboard tile.
 */
export type TileCommand = (() => Promise<void>) | (() => void);

export class Tile {
    // Required
    id: string;
    title: string;
    // Optional
    subtitle?: string;
    icon?: string;
    link?: string[]; // RouterLink route
    command?: TileCommand;
    size: 'sm' | 'md' | 'lg';
    permissions: string[];
    isCallbackThere: boolean;
    info: string;
    allowed = true;
    /**
     * Optional permission check. When provided, should return true for tile to be active/visible.
     */
    canActivate?: TilePermissionCheck;

    constructor(options: {
        id?: string;
        title: string;
        subtitle?: string;
        icon?: string;
        link?: string[];
        command?: TileCommand;
        size?: 'sm' | 'md' | 'lg';
        permissions?: string[];
        info?: string;
        canActivate?: TilePermissionCheck;
    }) {
        this.id = options.id ? options.id : 'TILE_ID_' + options.title;
        this.title = options.title;
        this.subtitle = options.subtitle;
        this.icon = options.icon;
        this.link = options.link;
        this.command = options.command;
        this.size = options.size || 'md';
        this.permissions = options.permissions || [];
        this.isCallbackThere =
            options.hasOwnProperty('command') &&
            typeof options.command === 'function';
        this.info = options.info || '';
        this.canActivate = options.canActivate;
    }

    get width() {
        return this.findSize(this.size).width;
    }

    get height() {
        return this.findSize(this.size).height;
    }

    invokeCallback() {
        if (this.isCallbackThere && this.command) {
            this.command();
        }
    }

    findSize(size: string): { width: string; height: string } {
        if (size === 'sm') {
            return sizeMap.sm;
        }
        if (size === 'lg') {
            return sizeMap.lg;
        }
        return sizeMap.md;
    }

    checkPermission(permissionService: PermissionService) {
        if (this.canActivate) {
            this.allowed = this.canActivate(permissionService);
        }
        return this.allowed;
    }

    /**
     * Helper to check if tile is allowed for display, using permission service.
     * @param permissionService
     */
    isAllowed(): boolean {
        return this.allowed;
    }
}

/**
 * TileGroup model class with extended structure.
 */
export class TileGroup {
    groupName: string;
    navName: string;
    id: string;
    tiles: Tile[];

    constructor(options: {
        groupName: string;
        navName?: string;
        id?: string;
        tiles: Tile[];
    }) {
        this.groupName = options.groupName;
        this.navName = options.navName ?? options.groupName;
        this.id = options.id ?? options.groupName;
        this.tiles = options.tiles;
    }

    hasVisibleTile() {
        return this.tiles.some((tile) => tile.isAllowed());
    }
}

/**
 * Factory function to build an array of TileGroups and Tiles from plain data.
 *
 * @param data - Array of plain objects (e.g., from configs or API) defining groups and their tiles.
 * @returns Array of fully instantiated TileGroup objects with Tile instances inside.
 */
export function makeLaunchPad(data: any, ps: PermissionService): TileGroup[] {
    if (!Array.isArray(data)) {
        throw new Error('makeLaunchPad expects an array');
    }

    return data.map((group: any) => {
        // Defensive for missing or malformed tiles
        const groupTiles = Array.isArray(group.tiles)
            ? group.tiles
                .map((tile: any) => new Tile(tile))
                .map((tile: Tile) => {
                    tile.checkPermission(ps);
                    return tile;
                })
            : [];

        return new TileGroup({
            groupName: group.groupName ?? group.name ?? '',
            navName: group.navName ?? group.name ?? '',
            id: group.id ?? group.name ?? '',
            tiles: groupTiles,
        });
    });
}
