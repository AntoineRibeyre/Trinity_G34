import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarDialog } from './avatar-dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('AvatarDialog', () => {
  let component: AvatarDialog;
  let fixture: ComponentFixture<AvatarDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;
  let translateService: TranslateService;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        AvatarDialog,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    spyOn(translateService, 'instant').and.returnValue('Translated Text');
    spyOn(translateService, 'get').and.returnValue(of('Translated Text'));

    fixture = TestBed.createComponent(AvatarDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize avatarList with 18 avatars', () => {
      expect(component.avatarList.length).toBe(18);
    });

    it('should have correct avatar paths', () => {
      expect(component.avatarList[0].path).toBe('assets/avatar/avatar-1.svg');
      expect(component.avatarList[17].path).toBe('assets/avatar/avatar-18.svg');
    });

    it('should have correct avatar IDs', () => {
      expect(component.avatarList[0].id).toBe(1);
      expect(component.avatarList[17].id).toBe(18);
    });

    it('should initialize selectedAvatarId as null', () => {
      expect(component.selectedAvatarId).toBeNull();
    });

    it('should initialize translate service', () => {
      expect(component.translateService).toBe(translateService);
    });

    it('should translate confirm and cancel buttons', () => {
      expect(translateService.instant).toHaveBeenCalledWith('BASE.EDIT');
      expect(translateService.instant).toHaveBeenCalledWith('BASE.CANCEL');
      expect(component.confirm).toBe('Translated Text');
      expect(component.cancel).toBe('Translated Text');
    });
  });

  describe('selectAvatar', () => {
    it('should set selectedAvatarId when avatar is selected', () => {
      component.selectAvatar(5);
      expect(component.selectedAvatarId).toBe(5);
    });

    it('should update selectedAvatarId when different avatar is selected', () => {
      component.selectAvatar(3);
      expect(component.selectedAvatarId).toBe(3);

      component.selectAvatar(7);
      expect(component.selectedAvatarId).toBe(7);
    });

    it('should handle selecting first avatar', () => {
      component.selectAvatar(1);
      expect(component.selectedAvatarId).toBe(1);
    });

    it('should handle selecting last avatar', () => {
      component.selectAvatar(18);
      expect(component.selectedAvatarId).toBe(18);
    });

    it('should handle selecting same avatar twice', () => {
      component.selectAvatar(5);
      component.selectAvatar(5);
      expect(component.selectedAvatarId).toBe(5);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without result', () => {
      mockDialogRef.close.calls.reset();
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should close dialog even if avatar is selected', () => {
      component.selectAvatar(5);
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onConfirm', () => {
    it('should close dialog with selectedAvatarId when avatar is selected', () => {
      component.selectAvatar(5);
      component.onConfirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith(5);
    });

    it('should close dialog with different selectedAvatarId', () => {
      component.selectAvatar(12);
      component.onConfirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith(12);
    });

    it('should not close dialog when no avatar is selected', () => {
      mockDialogRef.close.calls.reset();
      component.selectedAvatarId = null;
      component.onConfirm();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when selectedAvatarId is 0', () => {
      mockDialogRef.close.calls.reset();
      component.selectedAvatarId = 0;
      component.onConfirm();
      // 0 is falsy, so it should not close
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should close dialog with first avatar ID', () => {
      component.selectAvatar(1);
      component.onConfirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith(1);
    });

    it('should close dialog with last avatar ID', () => {
      component.selectAvatar(18);
      component.onConfirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith(18);
    });
  });

  describe('avatarList structure', () => {
    it('should have avatars with path and id properties', () => {
      component.avatarList.forEach(avatar => {
        expect(avatar.path).toBeDefined();
        expect(avatar.id).toBeDefined();
        expect(typeof avatar.path).toBe('string');
        expect(typeof avatar.id).toBe('number');
      });
    });

    it('should have sequential IDs from 1 to 18', () => {
      for (let i = 0; i < component.avatarList.length; i++) {
        expect(component.avatarList[i].id).toBe(i + 1);
      }
    });

    it('should have paths matching avatar IDs', () => {
      component.avatarList.forEach(avatar => {
        expect(avatar.path).toBe(`assets/avatar/avatar-${avatar.id}.svg`);
      });
    });
  });

  describe('Dialog reference', () => {
    it('should have access to dialog reference', () => {
      expect(component.dialogRef).toBe(mockDialogRef);
    });

    it('should allow closing dialog programmatically', () => {
      component.dialogRef.close();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});

