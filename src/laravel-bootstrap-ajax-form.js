(function($) {

    // Add the plugin functionality
    $.fn.initAjaxForm = function(options) {
        // Only deal with forms
        var affectedForms = this.filter("form");

        // Set default options
        var settings = $.extend({

            // Submit behavior during call
            submitClassDuringCall: null,
            submitTextDuringCall: "Please wait...",
            submitDisabledDuringCall: true,

            // Submit behavior after success
            submitClassAfterSuccess: null,
            submitTextAfterSuccess: null,
            submitDisabledAfterSuccess: true,

            // Submit behavior after error
            submitClassAfterError: null,
            submitTextAfterError: null,
            submitDisabledAfterError: false,

            // Error displaying parameters
            preventErrorDisplay : false;
            errorDisplayClass: 'has-error'
            errorMessageClass : 'help-block',

            // Callback related parameters
            preventDefaultBeforeSend: false,
            preventDefaultError: false,
            preventDefaultSuccess: false,

            // User defined input validation function.
            // Return with true if the input is valid.
            inputIsValid: null,

            // User defined callback functions
            beforeSend: null,
            error: null,
            success: null,
            complete: null,

            // AJAX related parameters
            dataType: 'json',
            password: null,
            timeout: null
        }, options );

        var resetForms = function() {
            var formItem = affectedForms.find('.form-group');
            formItem.removeClass(settings.errorDisplayClass);
            formItem.find(settings.errorMessageClass).remove();
        }

        affectedForms.each(function() {
            var form = $(this);

            // Setup submit event handler
            form.on('submit.LaravelBootstrapAjaxForm', function(e) {

                // Prevent the default behavior
                e.preventDefault();

                // Find and store the submitting element(s)
                submit = form.find('[type=submit]');

                // Collect data
                var data;
                var contentType;

                //run user provided validation, if available
                if ($.isFunction(settings.inputIsValid)) {
                    if (!settings.inputIsValid())
                    {
                        return false;
                    }
                }

                // Check for file inputs
                if (form.has('[type=file]')) {

                    // If found, prepare submission via FormData object.
                    contentType = 'multipart/form-data';
                    data = new FormData();

                    var input = form.serializeArray();
                    // Append input to FormData object.
                    $.each(input, function(index, input) {
                        data.append(input.name, input.value);
                    });

                    // Append files to FormData object.
                    $.each(form.find('[type=file]'), function(index, input) {
                        if (input.files.length == 1) {
                            data.append(input.name, input.files[0]);
                        } else if (input.files.length > 1) {
                            data.append(input.name, input.files);
                        }
                    });
                }
                // If no file input found, do not use FormData object (better browser compatibility).
                else {
                    contentType = 'application/x-www-form-urlencoded; charset=UTF-8';
                    data = form.serialize(),
                }

                // Send the request
                $.ajax({
                    url: form.attr('action'),
                    type: form.attr('method'),
                    beforeSend: function (){

                        //Check if the user wants to prevent our beforeSend function
                        if (!settings.preventDefaultBeforeSend) {

                            // Set the submit buttons text
                            var submitTextOriginal;
                            if (submit.is('button')) {
                                submitTextOriginal = submit.html();
                                submit.html(settings.submitTextDuringCall);
                            } else if (submit.is('input')) {
                                submitTextOriginal = submit.val();
                                submit.val(settings.submitTextDuringCall);
                            }

                            // If the user did not set a text for it, store the original
                            // text for the button for after the call
                            if (!settings.submitTextAfterSuccess) {
                                settings.submitTextAfterSuccess = submitTextOriginal;
                            }
                            if (!settings.submitTextAfterError) {
                                settings.submitTextAfterError = submitTextOriginal;
                            }

                            // Add the user defined classes
                            submit.addClass(settings.submitClassDuringCall);
                        }

                        // Run the user provided beforeSend function, if available
                        if ($.isFunction(settings.beforeSend)) {
                            settings.beforeSend();
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown){

                        // Check if the user wants to prevent us from displaying
                        // the errors laravel returned with the response
                        if (!settings.preventErrorDisplay) {
                            resetForms();
                            if (response.status == 422) {
                                var errors = $.parseJSON(jqXHR.responseText);

                                // Iterate through errors object
                                $.each(errors, function(field, message) {
                                    console.error(field + ': ' + message);
                                    // Handle arrays
                                    if (field.indexOf('.') != -1) {
                                        field = field.replace('.', '[');
                                        // Handle multi dimensional array
                                        for (i = 1; i <= (field.match(/./g) || []).length; i++) {
                                            field = field.replace('.', '][');
                                        }
                                        field = field + "]";
                                    }
                                    var formGroup = $('[name=' + field + ']', form).closest('.form-group');
                                    formGroup.addClass(settings.errorDisplayClass).append('<p class="' + settings.errorMessageClass + '">' + message + '</p>');
                                });

                                // Reset submit.
                                if (submit.is('button')) {
                                    submit.html(submitOriginal);
                                } else if (submit.is('input')) {
                                    submit.val(submitOriginal);
                                }

                                // If successful, reload.
                            }
                        }

                        //Check if the user wants to prevent our error function
                        if (!settings.preventDefaultError) {

                            // Set the submit buttons text
                            if (submit.is('button')) {
                                submit.html(settings.submitTextAfterError);
                            } else if (submit.is('input')) {
                                submit.val(settings.submitTextAfterError);
                            }
                        }

                        // Run the user provided error function, if available
                        if ($.isFunction(settings.error)) {
                            settings.error(jqXHR, textStatus, errorThrown);
                        }
                    },
                    success: function(data, textStatus, jqXHR){
                        resetForms();

                        //Check if the user wants to prevent our success function
                        if (!settings.preventDefaultSuccess) {

                            // Set the submit buttons text
                            if (submit.is('button')) {
                                submit.html(settings.submitTextAfterSuccess);
                            } else if (submit.is('input')) {
                                submit.val(settings.submitTextAfterSuccess);
                            }
                        }

                        // Run the user provided success function, if available
                        if ($.isFunction(settings.success)) {
                            settings.success(data, textStatus, jqXHR);
                        }
                    },
                    complete: function(jqXHR, textStatus){

                        // Run the user provided complete function, if available
                        if ($.isFunction(settings.complete)) {
                            settings.complete(jqXHR, textStatus);
                        }
                    },
                    dataType: settings.dataType,
                    data: data,
                    cache: false,
                    contentType: contentType,
                    processData: false,
                    password: settings.password
                });
            });

        });

        return this;
    };
}(jQuery));
