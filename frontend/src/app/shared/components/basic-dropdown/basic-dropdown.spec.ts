import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BasicDropdown, DropdownOption } from './basic-dropdown';

describe('BasicDropdown', () => {
  let component: BasicDropdown;
  let fixture: ComponentFixture<BasicDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicDropdown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicDropdown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input properties', () => {
    it('should have default values', () => {
      expect(component.options).toEqual([]);
      expect(component.placeholder).toBe('Sélectionnez une option');
      expect(component.selectedValue).toBeUndefined();
    });

    it('should accept options input', () => {
      const options: DropdownOption[] = [
        { label: 'Option 1', value: 1 },
        { label: 'Option 2', value: 2 }
      ];
      component.options = options;
      fixture.detectChanges();

      expect(component.options).toEqual(options);
    });

    it('should accept placeholder input', () => {
      component.placeholder = 'Choose an option';
      fixture.detectChanges();

      expect(component.placeholder).toBe('Choose an option');
    });

    it('should accept selectedValue input', () => {
      component.selectedValue = 2;
      fixture.detectChanges();

      expect(component.selectedValue).toBe(2);
    });
  });

  describe('handleChange', () => {
    it('should update selectedValue and emit selectionChange event', () => {
      spyOn(component.selectionChange, 'emit');
      const mockEvent = {
        target: {
          value: '3'
        }
      } as any;

      component.handleChange(mockEvent);

      expect(component.selectedValue).toBe(3);
      expect(component.selectionChange.emit).toHaveBeenCalledWith(3);
    });

    it('should handle string value and convert to number', () => {
      spyOn(component.selectionChange, 'emit');
      const mockEvent = {
        target: {
          value: '5'
        }
      } as any;

      component.handleChange(mockEvent);

      expect(component.selectedValue).toBe(5);
      expect(component.selectionChange.emit).toHaveBeenCalledWith(5);
    });

    it('should handle zero value', () => {
      spyOn(component.selectionChange, 'emit');
      const mockEvent = {
        target: {
          value: '0'
        }
      } as any;

      component.handleChange(mockEvent);

      expect(component.selectedValue).toBe(0);
      expect(component.selectionChange.emit).toHaveBeenCalledWith(0);
    });

    it('should handle negative values', () => {
      spyOn(component.selectionChange, 'emit');
      const mockEvent = {
        target: {
          value: '-1'
        }
      } as any;

      component.handleChange(mockEvent);

      expect(component.selectedValue).toBe(-1);
      expect(component.selectionChange.emit).toHaveBeenCalledWith(-1);
    });
  });

  describe('EventEmitter', () => {
    it('should have selectionChange EventEmitter', () => {
      expect(component.selectionChange).toBeDefined();
      expect(component.selectionChange.emit).toBeDefined();
    });

    it('should allow subscribing to selectionChange events', (done) => {
      component.selectionChange.subscribe((value) => {
        expect(value).toBe(2);
        done();
      });

      const mockEvent = {
        target: {
          value: '2'
        }
      } as any;

      component.handleChange(mockEvent);
    });
  });

  describe('Integration with options', () => {
    it('should work with provided options', () => {
      const options: DropdownOption[] = [
        { label: 'Test 1', value: 1 },
        { label: 'Test 2', value: 2 },
        { label: 'Test 3', value: 3 }
      ];
      component.options = options;
      fixture.detectChanges();

      expect(component.options.length).toBe(3);
      expect(component.options[0].value).toBe(1);
    });

    it('should handle empty options array', () => {
      component.options = [];
      fixture.detectChanges();

      expect(component.options).toEqual([]);
    });
  });
});
