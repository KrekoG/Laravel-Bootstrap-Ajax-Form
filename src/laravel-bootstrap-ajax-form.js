(function($) {

    // Add the plugin functionality
    $.fn.initAjaxForm = function(options) {
        // Only deal with forms
        var affectedForms = this.filter("form");

        // Set default options
        var settings = $.extend({

            // Form related parameters
            // Resets the form when it's modal is opened
            formIsOnModal: false,
            // User defined input validation function.
            // Return with true if the input is valid.
            inputIsValid: null,

            // Callback related parameters
            preventSubmitButtonModifications: false,

            // Submit button behavior during call
            submitClassDuringCall: null,
            submitTextDuringCall: "Please wait...",
            submitDisabledDuringCall: true,

            // Submit button behavior after success
            submitClassAfterSuccess: null,
            submitTextAfterSuccess: null,
            submitDisabledAfterSuccess: true,

            // Submit button behavior after error
            submitClassAfterError: null,
            submitTextAfterError: null,
            submitDisabledAfterError: false,

            // Error displaying parameters
            preventErrorDisplay : false,
            errorDisplayClass: 'has-error',
            errorMessageClass : 'help-block',

            // User defined callback functions
            beforeSend: null,
            error: null,
            success: null,
            complete: null,

            // AJAX related parameters
            ajaxParameters:{}
        }, options );

        var resetForms = function() {
            var formItem = affectedForms.find('.form-group');
            formItem.removeClass(settings.errorDisplayClass);
            formItem.find('.' + settings.errorMessageClass).remove();
        }

        affectedForms.each(function() {
            var form = $(this);

            // Setup modal event handler, if required
            if (settings.formIsOnModal) {
                // Search for closest modal upwards,
                // add reset call when modal starts show animation
                form.closest('.modal').on('show.bs.modal', function(e){
                    resetForms();
                });
            }

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

                if (form.has('[type=file]').length) {
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
                    data = form.serialize();
                }

                // Append the plugins parameters to the user provided ajax parameters
                var finalAjaxParameters = $.extend(settings.ajaxParameters, {
                    url: form.attr('action'),
                    type: form.attr('method'),
                    beforeSend: function (jqXHR, callSettings){

                        // Check if the user wants to prevent us from modifying
                        // the submit button
                        if (!settings.preventSubmitButtonModifications) {

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
                            // text of the button for after the call
                            if (!settings.submitTextAfterSuccess) {
                                settings.submitTextAfterSuccess = submitTextOriginal;
                            }
                            if (!settings.submitTextAfterError) {
                                settings.submitTextAfterError = submitTextOriginal;
                            }

                            // Disable submit button, if required
                            if (settings.submitDisabledDuringCall) {
                                submit.prop("disabled",true);
                            }

                            // Remove potential unneeded classes
                            if (settings.submitClassAfterSuccess) {
                                submit.removeClass(settings.submitClassAfterSuccess);
                            }
                            if (settings.submitClassAfterError) {
                                submit.removeClass(settings.submitClassAfterError);
                            }

                            // Add the user defined classes
                            if (settings.submitClassDuringCall) {
                                submit.addClass(settings.submitClassDuringCall);
                            }
                        }

                        // Run the user provided beforeSend function, if available
                        if ($.isFunction(settings.beforeSend)) {
                            settings.beforeSend(jqXHR, callSettings);
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown){

                        // Check if the user wants to prevent us from displaying
                        // the errors are what laravel returned with the response
                        if (!settings.preventErrorDisplay) {
                            resetForms();
                            if (jqXHR.status == 422) {
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
                            }
                        }

                        // Check if the user wants to prevent us from modifying
                        // the submit button
                        if (!settings.preventSubmitButtonModifications) {

                            // Set the submit buttons text
                            if (submit.is('button')) {
                                submit.html(settings.submitTextAfterError);
                            } else if (submit.is('input')) {
                                submit.val(settings.submitTextAfterError);
                            }

                            // Disable submit button, if required
                            if (settings.submitDisabledAfterError) {
                                submit.prop("disabled",true);
                            }

                            // Remove potential unneeded classes
                            if (settings.submitClassDuringCall) {
                                submit.removeClass(settings.submitClassDuringCall);
                            }

                            // Add the user defined classes
                            if (settings.submitClassAfterError) {
                                submit.addClass(settings.submitClassAfterError);
                            }
                        }

                        // Run the user provided error function, if available
                        if ($.isFunction(settings.error)) {
                            settings.error(jqXHR, textStatus, errorThrown);
                        }
                    },
                    success: function(data, textStatus, jqXHR){
                        resetForms();

                        // Check if the user wants to prevent us from modifying
                        // the submit button
                        if (!settings.preventSubmitButtonModifications) {

                            // Set the submit buttons text
                            if (submit.is('button')) {
                                submit.html(settings.submitTextAfterSuccess);
                            } else if (submit.is('input')) {
                                submit.val(settings.submitTextAfterSuccess);
                            }

                            // Disable submit button, if required
                            if (settings.submitDisabledAfterSuccess) {
                                submit.prop("disabled",true);
                            }

                            // Remove potential unneeded classes
                            if (settings.submitClassDuringCall) {
                                submit.removeClass(settings.submitClassDuringCall);
                            }

                            // Add the user defined classes
                            if (settings.submitClassAfterSuccess) {
                                submit.addClass(settings.submitClassAfterSuccess);
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
                    data: data,
                    contentType: contentType
                });

                // Send the request
                $.ajax(finalAjaxParameters);
            });

        });

        return this;
    };
}(jQuery));
