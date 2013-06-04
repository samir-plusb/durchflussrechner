;
(function($, window, document, undefined) {

  state = {
    NEW: 0,
    PUSH: 1
  };
  
  durchflusstype = {
    GASE: 0,
    FLUESSIGKEITEN: 1
  };
  
  rechnermodus = {
    RECHNER: 'Rechner',
    DURCHFLUSS: 'Durchfluss',
    CV: 'CV'
  };

  var Durchflussrechner = function(id) {
    var self = this;
    this.id = id;
    this.buttons = $('#' + id + ' .button');
    this.display = $('#' + id + ' #result');

    this.precision = 12;
    
    /**
     * Attribute initilisieren
     */
    this.result = 0.0;
    this.operand = null;
    this.operation = null;
    this.state = state.PUSH;
    this.a = null;
    this.b = null;
    this.ab_speichern = false;
    
    this.rechnermodus = rechnermodus.RECHNER;
    

    /**
     * Wir müssen prüfen, ob bereits ein Dezimal-Zeichen eingegeben wurde oder nicht
     */
    this.hasDecimal = false;
    this.decimal = null;


    Durchflussrechner.prototype.initBindings = function() {

      $(self.buttons).each(function(index, button) {
        $(button).mousedown(function() {
          
          if ($(button).hasClass('number') || $(button).hasClass('decimal_sign')) {
            //Die angeklickte Zahl oder das Dezimal-Zeichen wird in das Display eingetragen
            self.pushDisplay($(button).text());

          } else if ($(button).hasClass('operation')) {
          
            //Wenn keine Operation angegeben wurde, müssen wir den Operanden auf die letzte Eingabe setzen
            if(self.operation === null){
              self.operand = self.getResult();
            }else{
              //Wenn eine Operation einegegeben wurde, wird ein Zwischenergebnis generiert aus dem letzten Ergebnis mittels der Operation ausgeführt auf die aktuelle Eingabe
              self.operand = self.operation(self.operand, self.getResult());
            }
            
            //Nun setzen wir die neue Operation
            self.operation = self.getFunctionByName($(button).attr('id'));            
            
            //Wir wollen, dass bei der nächsten Eingabe die Zahlen wieder eingeschoben werden
            self.state = state.NEW;
            
            //Wir setzen das Zwischenergebnis ein
            self.setResult(self.operand);
            
          } else if ($(button).hasClass('equals')) {
            
            /**
             * Wenn auf = geklickt wird, muss das Ergebnis berechnet und angezeigt werden
             */

            if(self.operation !== null){
              self.setResult(self.operation(self.operand, self.getResult()));
              self.state = state.NEW;
              self.operation = null;
            }

          } else if ($(button).hasClass('transformation')) {

            //Die Zahl in der Anzeige wird transformiert, mittels der Operation, die angegeben wurde
            var transformation = self.getFunctionByName($(button).attr('id'));
            self.setResult(transformation(self.getResult()));

          } else if($(button).hasClass('switch_view')){
            
            /**
             * Es gibt drei Buttons, mit denen wir verschiedene Views umschalten müssen
             */
            self.toggleView($(button).attr('id'));
            
          } else if($(button).hasClass('fluss_operation')){
            var fluss_function = self.getFunctionByName($(button).attr('id'));
            self.setResult(fluss_function());
            
          } else if($(button).attr('id') === 'CE'){
            
            self.setResult(0);
            
          } else if($(button).attr('id') === 'clear'){
            
            self.clearDurchflussrechner();
            self.setResult(0);
            
          }
        });
      });
      
      /**
       * Funktionalität a/b speichern
       */
      $('#' + self.id + ' input#ab_speichern').change(function(){
        self.ab_speichern = $(this).prop('checked');
      });
      
      $('#' + self.id + ' #a,#b').click(function(){
        
        if(self.ab_speichern){
          
          //Wert speichern
          self[$(this).attr('id')] = self.getResult();
          $('#' + self.id + ' input#ab_speichern').prop('checked', false);
          self.ab_speichern = false;
          console.log(self.a, 'a');
          console.log(self.b, 'b');
        }else{
          if(self[$(this).attr('id')] !== null){
            self.setResult(self[$(this).attr('id')]);
            self.state = state.NEW;
          }
        }
        
      });
    };

    /**
     * 
     * Diese Methode hängt eine neue Ziffer an die vorhandene Ziffer im Display an oder fügt eine neue an. 
     * Dies hängt von dem Zustand des Taschenrechners ab, also self.state
     * 
     * @param {type} value
     * @returns {unresolved}
     */
    Durchflussrechner.prototype.pushDisplay = function(value) {
      self.checkDecimal();
      var oldNumber = self.correctDecimalSign(this.display.html());
      var newNumber = (oldNumber === '0' || self.state === state.NEW) ? value.toString() : oldNumber + value.toString();

      if (value === self.decimal) {
        if (!this.hasDecimal) {
          newNumber = (parseFloat(oldNumber.replace(/,/g, '.')) === 0 || self.state === state.NEW) ? '0' + self.decimal : oldNumber + value.toString();
          this.hasDecimal = true;
        } else {
          return;
        }
      }
      
      /**
       * Der Zustand gibt an, ob die neue Eingabe den Wert im Display überschreibt oder den Wert hinzufügt
       */
      if(self.state === state.NEW){
        self.state = state.PUSH;
      }
      
      /**
       * Der Punkt muss evtl. wieder durch ein Komma ersetzt werden
       */
      
      newNumber = self.correctDecimalSign(newNumber);
      this.display.html(newNumber);

    };
    
    Durchflussrechner.prototype.getDecimalSign = function(){
      return $('#' + self.id + ' #decimal').text();
    };
    
    Durchflussrechner.prototype.correctDecimalSign = function(number){      
      switch(self.decimal){
        case ',':
          number = number.replace(/\./g, ',');
          break;
        case '.':
          number = number.replace(/\,/g, '.');
          break;
        default: 
          alert('There is an error in the HTML-Markup!');
        break;
      }
      return number;
    };

    Durchflussrechner.prototype.setResult = function(value) {
      self.result = parseFloat(value.toPrecision(self.precision)); //Die eigentliche Zahl
      var result_display = self.correctDecimalSign(self.result.toString()); //Die Ausgabe der Zahl

      if(!isFinite(self.result) || isNaN(self.result)){
        result_display = 'ERROR';
        self.clearDurchflussrechner();
        /**
         * #TODO: Zustand: Neue Eingabe!
         */
      }
      
      $('#' + self.id + ' ' + '#result').html(result_display);
    };

    Durchflussrechner.prototype.getResult = function() {
      this.result = parseFloat($('#' + self.id + ' ' + '#result').text().toString().replace(/,/g, '.'));
      return this.result;
    };

    Durchflussrechner.prototype.setOperation = function(operation) {
      this.operation = operation;
      self.operand = self.getResult();
//      this.clear();
//      $('#' + id + ' #operation_display').html(this.operation.toString());
    };

    Durchflussrechner.prototype.getOperation = function() {
      return this.operation;
    };

    /**
     * Überprüft das eingegebene Dezimal-Zeichen und setzt sefl.hasDecimal und self.decimal
     * 
     * @returns {Boolean}
     */
    Durchflussrechner.prototype.checkDecimal = function() {
      //Prüfe, ob ein Decimal-Zeichen eingegeben wurde
      var check = false;
      if (this.display.text().indexOf(',') >= 0 || this.display.text().indexOf('.') >= 0) {
        check = true;
      }
      this.hasDecimal = check;
      
      //Gucke nach, welches Decimal-Zeichen benutzt werden sollte
      self.decimal = self.getDecimalSign();
      
      return check;
    };

    Durchflussrechner.prototype.clearDurchflussrechner = function() {
      self.result = 0;
      self.operand = null;
      self.operation = null;
      self.state = state.PUSH;
      self.a = null;
      self.b = null;
      self.ab_speichern = false;
    };

    Durchflussrechner.prototype.getFunctionByName = function(name) {
      var myFunction = null;
      for (var property in self) {
        if (typeof self[property] === 'function') {
          if (name === property) {
            myFunction = self[property];
          }
        }
      }
      return myFunction;
    };
    
    /**
     * Diese Funktion kümmert sich um die Anzeige der passenden View. Dazu muss die passende id
     * 'Durchfluss', 'CV' oder 'Rechner' übergeben werden 
     *
     * 
     * @param string id
     * @returns
     */
    Durchflussrechner.prototype.toggleView = function(id){
      $('#' + this.id + ' .middle').css('display', 'none');
      this.rechnermodus = id;
      
      if(id === rechnermodus.CV || id === rechnermodus.DURCHFLUSS){

        //Höhe der View anpassen
        $('#' + this.id + ' #Fluss_view')
              .css('display', 'block')                                                   //View anzeigen
              .css('width', $('#' + this.id + ' .middle#Rechner_view').css('width'))     //Breite angleichen
              .css('height', $('#' + this.id + ' .middle#Rechner_view').css('height'));  //Höhe angleichen
        
        //Operationen und rechte Seite ausblenden
        $('#' + this.id + ' .button#Rechner').css('display', 'block');
        $('#' + this.id +  ' .button#CE, .button#clear').css('display', 'none');
        $('#' + this.id +  ' .right').css('display', 'none');
        
        //Je nach Modus muss der Durchfluss-Wert oder CV-Wert angezeigt werden
        switch (id){
          case 'CV':
            $('#' + this.id + ' .' + id + '_view').css('display', 'block');
            $('#' + this.id + ' .Durchfluss_view').css('display', 'none');
            break;
          case 'Durchfluss':
            $('#' + this.id + ' .' + id + '_view').css('display', 'block');
            $('#' + this.id + ' .CV_view').css('display', 'none');
            break;
          default:
            break;
        }
        
      //Im Rechner-Modus müssen wieder die normalen Buttons angezeigt werden
      }else if(id === rechnermodus.RECHNER){
        $('#' + this.id + ' #Rechner_view').css('display', 'block');                                                   //View anzeigen
        $('#' + this.id + ' .button#Rechner').css('display', 'none');
        $('#' + this.id + ' .button#CE, .button#clear').css('display', 'inline-block');
        $('#' + this.id +  ' .right').css('display', 'block');
      }
      
      
    };
    
    
    /**
     * OPERATIONS
     * 
     * Eine Operation ist eine Funktion mit zwei Parametern
     */
    
    Durchflussrechner.prototype.addition = function(x, y) {
      return x + y;
    };

    Durchflussrechner.prototype.subtraction = function(x, y) {
      return x - y;
    };

    Durchflussrechner.prototype.multiplication = function(x, y) {
      return x * y;
    };

    Durchflussrechner.prototype.division = function(x, y) {
      return x / y;
    };
    
    Durchflussrechner.prototype.percent = function(x, y) {
      return (y / x) * 100;
    };
    
    /**
     * TRANSFORMATIONS
     * 
     * Eine Transformation ist eine Funktion mit zwei Parametern
     */
    
    Durchflussrechner.prototype.square_root = function(x) {
      return Math.sqrt(x);
    };    
    
    Durchflussrechner.prototype.negation = function(x) {
      return x * -1;
    };    
    
    Durchflussrechner.prototype.fraction_1_x = function(x) {
      return 1 / x;
    };    
    
    

    
    /**
     * 
     * Formeln für die Berechnung des Durchfluss und des CV-Werts
     * 
     * @returns {unresolved}
     */
    Durchflussrechner.prototype.berechneFluss = function() {
      var result = 0;
      var type = parseInt($('#' + self.id +  ' #durchflusstype').val());
      switch(self.rechnermodus){
        case rechnermodus.CV:
          result = self.berechneCV(type);
          break;
        case rechnermodus.DURCHFLUSS:
          result = self.berechneDurchfluss(type);
          break;
        default:
          window.alert('Der Rechner ist im Falschen Modus');
          return null;
          break;
      }
      return result;
    };
    
    Durchflussrechner.prototype.berechneCV = function(type) {
      var parameter = self.getCVParameter();
      console.log('Parameter', parameter);
      switch(type){
        case durchflusstype.GASE:
          var formel_a = (2 * parameter.durchfluss_wert / 28.3) / ((parameter.eingangsdruck * 14.5) + 14.7) * Math.sqrt(parameter.gravitivitaet);
          var formel_b = parameter.durchfluss_wert / 28.3 * Math.sqrt(parameter.gravitivitaet / (((parameter.eingangsdruck - parameter.ausgangsdruck) * 14.5) * (parameter.ausgangsdruck * 14.5 + 14.7)));
          return (parameter.eingangsdruck < 2 * parameter.ausgangsdruck) ? formel_b : formel_a;
          break;
        case durchflusstype.FLUESSIGKEITEN:
          return (parameter.durchfluss_wert / 3.78 * Math.sqrt(parameter.gravitivitaet)) / (Math.sqrt((parameter.eingangsdruck - parameter.ausgangsdruck) * 14.5));
          break;
        default:
          window.alert('Bitte auswählen...');
           break;
      }
    };
    
    Durchflussrechner.prototype.berechneDurchfluss = function(type) {
      var parameter = self.getDurchflussParameter();
      console.log('Parameter', parameter);
      switch(type){
        case durchflusstype.GASE:
          var formel_a = parameter.cv_wert * 28.3 / 2 / Math.sqrt(parameter.gravitivitaet) * ( (parameter.eingangsdruck * 14.5) + 14.7 );
          var formel_b = parameter.cv_wert * 28.3 / (Math.sqrt(parameter.gravitivitaet / ( ( (parameter.eingangsdruck - parameter.ausgangsdruck) * 14.5) * (parameter.ausgangsdruck * 14.5 + 14.7) ) ) );
          return (parameter.eingangsdruck < 2 * parameter.ausgangsdruck) ? formel_b : formel_a;
          break;
        case durchflusstype.FLUESSIGKEITEN:
          return (parameter.cv_wert / Math.sqrt(parameter.gravitivitaet)) * (Math.sqrt((parameter.eingangsdruck - parameter.ausgangsdruck) * 14.5) * 3.78);
          break;
        default:
          window.alert('Bitte auswählen...');
           break;
      }
    };
    
    Durchflussrechner.prototype.getDurchflussParameter = function(){
      return {
        cv_wert:       parseFloat($('#' + self.id + ' #cv_wert').val().replace(/,/g, '.')), 
        gravitivitaet: parseFloat($('#' + self.id + ' #gravitivitaet').val().replace(/,/g, '.')), 
        eingangsdruck: parseFloat($('#' + self.id + ' #eingangsdruck').val().replace(/,/g, '.')), 
        ausgangsdruck: parseFloat($('#' + self.id + ' #ausgangsdruck').val().replace(/,/g, '.'))
      };
    };
    
    
    Durchflussrechner.prototype.getCVParameter = function(){
      return {
        durchfluss_wert:       parseFloat($('#' + self.id + ' #durchfluss_wert').val().replace(/,/g, '.')), 
        gravitivitaet:         parseFloat($('#' + self.id + ' #gravitivitaet').val().replace(/,/g, '.')), 
        eingangsdruck:         parseFloat($('#' + self.id + ' #eingangsdruck').val().replace(/,/g, '.')), 
        ausgangsdruck:         parseFloat($('#' + self.id + ' #ausgangsdruck').val().replace(/,/g, '.'))
      };
    };
    
    /**
     * 
     * Initialisierung
     * 
     */
    self.checkDecimal();
    self.initBindings();

  };

  $(function() {
    var durchflussrechner = new Durchflussrechner('durchflussrechner');
  });
})(jQuery, window, document);