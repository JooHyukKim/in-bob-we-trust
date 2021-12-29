package com.inbobwetrust.relay;

import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.support.WebExchangeBindException;

@ControllerAdvice
@Slf4j
public class ExceptionHandlerAdvice {

  @ExceptionHandler(value = {WebExchangeBindException.class})
  public ResponseEntity<String> handleConstraintViolation(WebExchangeBindException ex) {
    log.error("{} caught by advice : {} ", ex.getClass().getName(), ex.getMessage(), ex);
    var error =
        ex.getBindingResult().getAllErrors().stream()
            .map(DefaultMessageSourceResolvable::getDefaultMessage)
            .sorted()
            .collect(Collectors.joining(" / "));
    log.error("Error is : {}", error);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }
}
