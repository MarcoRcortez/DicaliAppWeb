package bo.edu.dicali.recruitment.repository;

import bo.edu.dicali.recruitment.model.CompanyProfileModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface CompanyProfileRepository extends MongoRepository<CompanyProfileModel, String> {
    Optional<CompanyProfileModel> findByUserId(String userId);
    boolean existsByUserId(String userId);
}
