package com.mahmudalam.jobportal.spring_boot_job_portal_app.config;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifica la validación de suma de pesos del matching (T7): el {@code @PostConstruct}
 * registra un WARN cuando los pesos no suman 1.0, y no lo hace cuando sí suman.
 * Se captura el log con un {@link ListAppender} de Logback sobre el logger de la clase.
 */
class MatchingWeightsPropertiesTest {

    private ListAppender<ILoggingEvent> capturarLog() {
        Logger logger = (Logger) LoggerFactory.getLogger(MatchingWeightsProperties.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        return appender;
    }

    @Test
    void pesosPorDefectoSuman1YnoEmitenWarn() {
        ListAppender<ILoggingEvent> log = capturarLog();
        new MatchingWeightsProperties().validateSum();
        assertTrue(log.list.stream().noneMatch(e -> e.getLevel() == Level.WARN),
                "Los pesos por defecto suman 1.0; no debe registrarse ningún WARN");
    }

    @Test
    void pesosQueNoSuman1EmitenWarn() {
        ListAppender<ILoggingEvent> log = capturarLog();
        MatchingWeightsProperties w = new MatchingWeightsProperties();
        w.setTechnical(0.5); // rompe la suma (por defecto es 0.22)
        w.validateSum();
        assertTrue(log.list.stream().anyMatch(e -> e.getLevel() == Level.WARN),
                "Pesos que no suman 1.0 deben registrar un WARN");
    }
}
